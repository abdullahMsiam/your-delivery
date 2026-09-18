import type { Request, Response } from "express";

import AppError from "../../utils/AppError.js";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";

import {
  createDeliverySchema,
  myDeliveriesQuerySchema,
} from "./delivery.validation.js";
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

const getMyDeliveries = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  const query = myDeliveriesQuerySchema.parse(req.query);

  const result = await deliveryService.getMyDeliveries(req.user.userId, query);

  res.status(200).json({
    success: true,
    message: "My deliveries retrieved successfully",
    data: result,
  });
};

const getMyDeliveryById = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  const deliveryId = req.params.id;

  if (!deliveryId) {
    throw new AppError(400, "Delivery ID is required");
  }

  const delivery = await deliveryService.getMyDeliveryById(
    req.user.userId,
    deliveryId as string,
  );

  res.status(200).json({
    success: true,
    message: "Delivery retrieved successfully",
    data: delivery,
  });
};

const trackDelivery = async (req: Request, res: Response) => {
  const trackingId = req.params.trackingId;

  if (!trackingId) {
    throw new AppError(400, "Tracking ID is required");
  }

  const delivery = await deliveryService.trackDelivery(trackingId as string);

  res.status(200).json({
    success: true,
    message: "Delivery tracked successfully",
    data: delivery,
  });
};
export const deliveryController = {
  createDelivery,
  getMyDeliveries,
  getMyDeliveryById,
  trackDelivery,
};
