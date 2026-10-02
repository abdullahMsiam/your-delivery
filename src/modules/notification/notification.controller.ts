import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { notificationService } from "./notification.service.js";
import { getNotificationsQuerySchema, notificationIdSchema } from "./notification.validation.js";

const getMyNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const query = getNotificationsQuerySchema.parse(req.query);

  const result = await notificationService.getMyNotifications(
    req.user!.userId,
    query,
  );

  res.status(200).json({
    success: true,
    message: "Notifications retrieved successfully",
    ...result,
  });
};

const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const result = await notificationService.getUnreadCount(
    req.user!.userId,
  );

  res.status(200).json({
    success: true,
    message: "Unread notification count retrieved successfully",
    data: result,
  });
};

const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const { id } = notificationIdSchema.parse(req.params);

  const notification = await notificationService.markAsRead(
    id,
    req.user!.userId,
  );
 
  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
};

const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const result = await notificationService.markAllAsRead(
    req.user!.userId,
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
    data: result,
  });
};

export const notificationController = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};