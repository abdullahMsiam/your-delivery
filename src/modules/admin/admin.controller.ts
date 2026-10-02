import { Request, Response } from "express";
import { adminService } from "./admin.service.js";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import AppError from "../../utils/AppError.js";
import {
  assignAgentSchema,
  getAdminDeliveriesQuerySchema,
  getUsersQuerySchema,
} from "./admin.validation.js";
import { agentIdSchema } from "../agent/agent.validation.js";

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

const getDeliveryById = async (req: Request, res: Response) => {
  const deliveryId = req.params.id;

  if (!deliveryId) {
    throw new AppError(400, "Delivery ID is required");
  }

  const delivery = await adminService.getDeliveryById(deliveryId as string);

  res.status(200).json({
    success: true,
    message: "Delivery retrieved successfully",
    data: delivery,
  });
};

const reassignAgent = async (req: AuthenticatedRequest, res: Response) => {
  const deliveryId = req.params.id;

  if (!deliveryId) {
    throw new AppError(400, "Delivery ID is required");
  }

  const { agentId } = req.body;

  const delivery = await adminService.reassignAgent(
    deliveryId as string,
    agentId as string,
    req.user!.userId,
  );

  res.status(200).json({
    success: true,
    message: "Agent reassigned successfully",
    data: delivery,
  });
};

const cancelDelivery = async (req: AuthenticatedRequest, res: Response) => {
  const deliveryId = req.params.id;

  if (!deliveryId) {
    throw new AppError(400, "Delivery ID is required");
  }

  const { note } = req.body;

  const delivery = await adminService.cancelDelivery(
    deliveryId as string,
    req.user!.userId,
    note,
  );

  res.status(200).json({
    success: true,
    message: "Delivery cancelled successfully",
    data: delivery,
  });
};

const getAllDeliveriesInSearch = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const query = getAdminDeliveriesQuerySchema.parse(req.query);

  const result = await adminService.getAllDeliveriesInSearch(query);

  res.status(200).json({
    success: true,
    message: "Deliveries retrieved successfully",
    ...result,
  });
};

const getAgentById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = agentIdSchema.parse(req.params);

  //need to update the service to get agent by id and return the agent details
  const agent = await adminService.getUserById(id);

  res.status(200).json({
    success: true,
    message: "Agent details retrieved successfully",
    data: agent,
  });
};

const getAgentStatistics = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = agentIdSchema.parse(req.params);

  const result = await adminService.getAgentStatistics(id);

  res.status(200).json({
    success: true,
    message: "Agent statistics retrieved successfully",
    data: result,
  });
};

const getDashboard = async (req: AuthenticatedRequest, res: Response) => {
  const dashboard = await adminService.getDashboard();

  res.status(200).json({
    success: true,
    message: "Admin dashboard data retrieved successfully",
    data: dashboard,
  });
};

export const adminController = {
  getAllDeliveries,
  getAllDeliveriesInSearch,
  assignAgent,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getDeliveryById,
  reassignAgent,
  cancelDelivery,
  getAgentById,
  getAgentStatistics,
  getDashboard,
};
