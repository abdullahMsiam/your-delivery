import Stripe from "stripe";
import stripe from "../../config/stripe.js";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import { notificationService } from "../notification/notification.service.js";

const createPaymentIntent = async (customerId: string, deliveryId: string) => {
  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      customerId,
    },
    include: {
      payment: true,
    },
  });

  if (!delivery) {
    throw new AppError(404, "Delivery not found");
  }

  if (!delivery.payment) {
    throw new AppError(404, "Payment record not found");
  }

  if (delivery.payment.method !== "STRIPE") {
    throw new AppError(400, "This delivery does not use Stripe payment");
  }

  if (delivery.payment.status === "PAID") {
    throw new AppError(400, "Payment already completed");
  }

  const amount = Math.round(Number(delivery.deliveryCharge) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: process.env.STRIPE_CURRENCY || "usd",
    metadata: {
      deliveryId: delivery.id,
      paymentId: delivery.payment.id,
    },
  });

  await prisma.payment.update({
    where: {
      id: delivery.payment.id,
    },
    data: {
      stripePaymentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret,
      status: "PROCESSING",
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
};

const getPaymentByDelivery = async (customerId: string, deliveryId: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      deliveryId,
      delivery: {
        customerId,
      },
    },
    select: {
      id: true,
      deliveryId: true,
      method: true,
      status: true,
      amount: true,
      stripePaymentId: true,
      paidAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  return payment;
};

const handleStripeWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const payment = await prisma.payment.findFirst({
        where: {
          stripePaymentId: paymentIntent.id,
        },
        include: {
          delivery: {
            select: {
              trackingId: true,
              customerId: true,
            },
          },
        },
      });

      if (!payment) {
        console.error(
          `Payment not found for Stripe PaymentIntent: ${paymentIntent.id}`,
        );
        break;
      }

      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      try {
        await notificationService.createNotification({
          userId: payment.delivery.customerId,
          type: "PAYMENT_PAID",
          title: "Payment Successful",
          message: `Payment for parcel ${payment.delivery.trackingId} was successful.`,
        });
      } catch (error) {
        console.error("Failed to create payment success notification:", error);
      }

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const payment = await prisma.payment.findFirst({
        where: {
          stripePaymentId: paymentIntent.id,
        },
        include: {
          delivery: {
            select: {
              trackingId: true,
              customerId: true,
            },
          },
        },
      });

      if (!payment) {
        console.error(
          `Payment not found for Stripe PaymentIntent: ${paymentIntent.id}`,
        );
        break;
      }

      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "FAILED",
        },
      });

      try {
        await notificationService.createNotification({
          userId: payment.delivery.customerId,
          type: "PAYMENT_FAILED",
          title: "Payment Failed",
          message: `Payment for parcel ${payment.delivery.trackingId} failed.`,
        });
      } catch (error) {
        console.error("Failed to create payment failure notification:", error);
      }

      break;
    }

    case "payment_intent.processing": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      await prisma.payment.updateMany({
        where: {
          stripePaymentId: paymentIntent.id,
        },
        data: {
          status: "PROCESSING",
        },
      });

      break;
    }

    default:
      break;
  }
};

const markCodAsPaid = async (deliveryId: string, agentId: string) => {
  const delivery = await prisma.delivery.findUnique({
    where: {
      id: deliveryId,
    },
    include: {
      payment: true,
    },
  });

  if (!delivery) {
    throw new AppError(404, "Delivery not found");
  }

  if (delivery.agentId !== agentId) {
    throw new AppError(403, "You are not assigned to this delivery");
  }

  if (delivery.status !== "DELIVERED") {
    throw new AppError(
      400,
      "COD payment can only be marked as paid after delivery",
    );
  }

  if (!delivery.payment) {
    throw new AppError(404, "Payment record not found");
  }

  if (delivery.payment.method !== "COD") {
    throw new AppError(400, "This delivery does not use Cash on Delivery");
  }

  if (delivery.payment.status === "PAID") {
    throw new AppError(400, "COD payment is already marked as paid");
  }

  if (
    delivery.payment.status === "CANCELLED" ||
    delivery.payment.status === "REFUNDED"
  ) {
    throw new AppError(
      400,
      `Payment cannot be marked as paid when status is ${delivery.payment.status}`,
    );
  }

  const updatedPayment = await prisma.payment.update({
    where: {
      deliveryId,
    },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
    select: {
      id: true,
      deliveryId: true,
      method: true,
      status: true,
      amount: true,
      paidAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Notify customer about COD payment
  try {
    await notificationService.createNotification({
      userId: delivery.customerId,
      type: "COD_PAYMENT_RECEIVED",
      title: "COD Payment Received",
      message: `Cash payment for parcel ${delivery.trackingId} has been received.`,
    });
  } catch (error) {
    console.error("Failed to create COD payment notification:", error);
  }

  return updatedPayment;
};

export const paymentService = {
  createPaymentIntent,
  getPaymentByDelivery,
  handleStripeWebhook,
  markCodAsPaid,
};
