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

export const deliveryRouter = router;
