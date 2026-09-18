import { Request, Response } from "express";
import { adminService } from "./admin.service.js";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import AppError from "../../utils/AppError.js";
import { assignAgentSchema } from "./admin.validation.js";

const getAllDeliveries = async (req: Request, res: Response) => {
  const deliveries = await adminService.getAllDeliveries();

  res.status(200).json({
    success: true,
    message: "Deliveries fetched successfully",
    data: deliveries,
  });
};

const assignAgent = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  const deliveryId = req.params.id;

  if (!deliveryId) {
    throw new AppError(400, "Delivery Id is required");
  }

  const validatedData = assignAgentSchema.parse(req.body);

  const delivery = await adminService.assignAgent(
    deliveryId as string,
    validatedData.agentId,
    req.user.userId,
  );

  res.status(200).json({
    success: true,
    message: "Agent assigned successfully",
    data: delivery,
  });
};

export const adminController = {
  getAllDeliveries,
  assignAgent,
};
