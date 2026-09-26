import { Request, Response } from "express";
import { paymentService } from "./payment.service.js";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import AppError from "../../utils/AppError.js";
import stripe from "../../config/stripe.js";

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
    throw new AppError(400, "Missing Stripe signature");
  }

  const event = stripe.webhooks.constructEvent(
    req.body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  await paymentService.handleStripeWebhook(event);

  res.status(200).json({
    success: true,
    message: "Webhook processed successfully",
  });
};
export const paymentController = {
  createPaymentIntent,
  getPaymentByDelivery,
  handleStripeWebhook,
};
