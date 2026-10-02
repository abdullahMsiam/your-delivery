import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { notificationController } from "./notification.controller.js";

const router = Router();

router.get("/", auth, asyncHandler(notificationController.getMyNotifications));

router.get(
  "/unread-count",
  auth,
  asyncHandler(notificationController.getUnreadCount),
);

router.patch(
  "/read-all",
  auth,
  asyncHandler(notificationController.markAllAsRead),
);

router.patch(
  "/:id/read",
  auth,
  asyncHandler(notificationController.markAsRead),
);

export const notificationRouter = router;
