import { Router } from "express";

import auth from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";

import { deliveryController } from "./delivery.controller.js";

const router = Router();

router.post(
  "/",
  auth,
  authorize("CUSTOMER"),
  asyncHandler(deliveryController.createDelivery),
);

router.get(
  "/my-deliveries",
  auth,
  authorize("CUSTOMER"),
  asyncHandler(deliveryController.getMyDeliveries),
);

router.get(
  "/:id",
  auth,
  authorize("CUSTOMER"),
  asyncHandler(deliveryController.getMyDeliveryById),
);

router.get(
  "/track/:trackingId",
  asyncHandler(deliveryController.trackDelivery),
);

//Todo:

export const deliveryRouter = router;
