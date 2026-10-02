import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import authorized from "../../middlewares/role.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { adminController } from "./admin.controller.js";

const router = Router();

router.get(
  "/dashboard",
  auth,
  authorized("ADMIN"),
  asyncHandler(adminController.getDashboard),
);

router.get(
  "/deliveries",
  auth,
  authorized("ADMIN"),
  asyncHandler(adminController.getAllDeliveriesInSearch),
);

router.patch(
  "/deliveries/:id/assign-agent",
  auth,
  authorized("ADMIN"),
  asyncHandler(adminController.assignAgent),
);

router.get(
  "/users",
  auth,
  authorized("ADMIN"),
  asyncHandler(adminController.getUsers),
);

router.get(
  "/users/:id",
  auth,
  authorized("ADMIN"),
  asyncHandler(adminController.getUserById),
);

router.patch(
  "/users/:id/status",
  auth,
  authorized("ADMIN"),
  asyncHandler(adminController.updateUserStatus),
);

router.patch(
  "/users/:id/role",
  auth,
  authorized("ADMIN"),
  asyncHandler(adminController.updateUserRole),
);

router.get(
  "/deliveries/:id",
  auth,
  authorized("ADMIN"),
  asyncHandler(adminController.getDeliveryById),
);

router.patch(
  "/deliveries/:id/reassign-agent",
  auth,
  authorized("ADMIN"),
  asyncHandler(adminController.reassignAgent),
);

router.patch(
  "/deliveries/:id/cancel",
  auth,
  authorized("ADMIN"),
  asyncHandler(adminController.cancelDelivery),
);

router.get(
  "/agents/:id",
  auth,
  authorized("ADMIN"),
  asyncHandler(adminController.getAgentById),
);

router.get(
  "/agents/:id/statistics",
  auth,
  authorized("ADMIN"),
  asyncHandler(adminController.getAgentStatistics),
);

export const adminRouter = router;
