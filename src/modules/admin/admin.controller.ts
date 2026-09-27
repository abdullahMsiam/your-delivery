import { Request, Response } from "express";
import { adminService } from "./admin.service.js";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import AppError from "../../utils/AppError.js";
import { assignAgentSchema, getUsersQuerySchema } from "./admin.validation.js";

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

const getUsers = async (req: Request, res: Response) => {
  const query = getUsersQuerySchema.parse(req.query);

  const result = await adminService.getUsers(query);

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: result,
  });
};

const getUserById = async (req: Request, res: Response) => {
  const userId = req.params.id;

  if (!userId) {
    throw new AppError(400, "User ID is required");
  }

  const user = await adminService.getUserById(userId as string);

  res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
};

const updateUserStatus = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id;

  if (!userId) {
    throw new AppError(400, "User ID is required");
  }

  const { isActive } = req.body;

  const user = await adminService.updateUserStatus(
    userId as string,
    req.user!.userId,
    isActive,
  );

  res.status(200).json({
    success: true,
    message: "User status updated successfully",
    data: user,
  });
};

const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id;

  if (!userId) {
    throw new AppError(400, "User ID is required");
  }

  const { role } = req.body;

  const user = await adminService.updateUserRole(
    userId as string,
    req.user!.userId,
    role,
  );

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    data: user,
  });
};

export const adminController = {
  getAllDeliveries,
  assignAgent,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
};
