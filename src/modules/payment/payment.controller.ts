import { Request, Response } from "express";
import { paymentService } from "./payment.service.js";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import AppError from "../../utils/AppError.js";
import stripe from "../../config/stripe.js";
import Stripe from "stripe";

const createPaymentIntent = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { deliveryId } = req.body;

  const result = await paymentService.createPaymentIntent(
    req.user?.userId as string,
    deliveryId,
  );

  res.status(200).json({
    success: true,
    message: "Payment intent created successfully",
    data: result,
  });
};

const getPaymentByDelivery = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { deliveryId } = req.params;

  const payment = await paymentService.getPaymentByDelivery(
    req.user?.userId as string,
    deliveryId as string,
  );

  res.status(200).json({
    success: true,
    message: "Payment retrieved successfully",
    data: payment,
  });
};

const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    throw new AppError(400, "Stripe signature is missing");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);

    throw new AppError(400, "Invalid Stripe webhook signature");
  }

  await paymentService.handleStripeWebhook(event);

  res.status(200).json({
    success: true,
    message: "Webhook received successfully",
  });
};

const markCodAsPaid = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const deliveryId = req.params.deliveryId;

  if (!deliveryId) {
    throw new AppError(400, "Delivery ID is required");
  }

  const payment = await paymentService.markCodAsPaid(
    deliveryId as string,
    req.user!.userId,
  );

  res.status(200).json({
    success: true,
    message: "COD payment marked as paid successfully",
    data: payment,
  });
};

export const paymentController = {
  createPaymentIntent,
  getPaymentByDelivery,
  handleStripeWebhook,
  markCodAsPaid, 
};
