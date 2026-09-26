import Stripe from "stripe";
import stripe from "../../config/stripe.js";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";

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

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      await prisma.payment.updateMany({
        where: {
          stripePaymentId: paymentIntent.id,
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      await prisma.payment.updateMany({
        where: {
          stripePaymentId: paymentIntent.id,
        },
        data: {
          status: "FAILED",
        },
      });

      break;
    }
  }
};

export const paymentService = {
  createPaymentIntent,
  getPaymentByDelivery,
  handleStripeWebhook, 
};
