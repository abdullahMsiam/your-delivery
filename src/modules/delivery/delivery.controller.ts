import type { Response } from "express";

import AppError from "../../utils/AppError.js";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";

import { createDeliverySchema } from "./delivery.validation.js";
import { deliveryService } from "./delivery.service.js";

const createDelivery = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  const validatedData = createDeliverySchema.parse(req.body);

  const delivery = await deliveryService.createDelivery(
    req.user.userId,
    validatedData,
  );

  res.status(201).json({
    success: true,
    message: "Delivery created successfully",
    data: delivery,
  });
};

export const deliveryController = {
  createDelivery,
};
