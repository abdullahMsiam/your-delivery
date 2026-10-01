import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import authorized from "../../middlewares/role.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { agentController } from "./agent.controller.js";

const router = Router();

router.get(
  "/me",
  auth,
  authorized("AGENT"),
  asyncHandler(agentController.getMyDetails),
);

router.get(
  "/statistics",
  auth,
  authorized("AGENT"),
  asyncHandler(agentController.getMyStatistics),
);

router.get(
  "/deliveries",
  auth,
  authorized("AGENT"),
  asyncHandler(agentController.getMyDeliveries),
);

router.patch(
  "/deliveries/:id/status",
  auth,
  authorized("AGENT"),
  asyncHandler(agentController.updateDeliveryStatus),
);

export const agentRouter = router;
