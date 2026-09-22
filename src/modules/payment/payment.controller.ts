import { Request, Response } from "express";
import { paymentService } from "./payment.service.js";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";

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

export const paymentController = {
  createPaymentIntent,
  getPaymentByDelivery,
};
