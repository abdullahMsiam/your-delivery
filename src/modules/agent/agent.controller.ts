import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { agentService } from "./agent.service.js";
import {
  deliveryIdSchema,
  getAgentDeliveriesQuerySchema,
  updateDeliveryStatusSchema,
} from "./agent.validation.js";

const getMyDetails = async (req: AuthenticatedRequest, res: Response) => {
  const agent = await agentService.getMyAgentDetails(req.user!.userId);

  res.status(200).json({
    success: true,
    message: "Agent details retrieved successfully",
    data: agent,
  });
};

const getMyStatistics = async (req: AuthenticatedRequest, res: Response) => {
  const result = await agentService.getAgentStatistics(req.user!.userId);

  res.status(200).json({
    success: true,
    message: "Agent statistics retrieved successfully",
    data: result,
  });
};

const getMyDeliveries = async (req: AuthenticatedRequest, res: Response) => {
  const query = getAgentDeliveriesQuerySchema.parse(req.query);

  const result = await agentService.getMyDeliveries(req.user!.userId, query);

  res.status(200).json({
    success: true,
    message: "Assigned deliveries retrieved successfully",
    ...result,
  });
};

const updateDeliveryStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = deliveryIdSchema.parse(req.params);

  const data = updateDeliveryStatusSchema.parse(req.body);

  const delivery = await agentService.updateDeliveryStatus(
    id,
    req.user!.userId,
    data.status,
    data.note,
  );

  res.status(200).json({
    success: true,
    message: "Delivery status updated successfully",
    data: delivery,
  });
};

export const agentController = {
  getMyDetails,
  getMyStatistics,
  getMyDeliveries,
  updateDeliveryStatus,
};
