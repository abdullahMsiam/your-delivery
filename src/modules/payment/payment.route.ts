import { Router } from "express";
import { paymentController } from "./payment.controller.js";

import asyncHandler from "../../utils/asyncHandler.js";
import auth from "../../middlewares/auth.middleware.js";
import authorized from "../../middlewares/role.middleware.js";
import express from "express";

const router = Router();

router.post(
  "/create-intent",
  auth,
  authorized("CUSTOMER"),
  asyncHandler(paymentController.createPaymentIntent),
);

router.get(
  "/:deliveryId",
  auth,
  authorized("CUSTOMER"),
  asyncHandler(paymentController.getPaymentByDelivery),
);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(paymentController.handleStripeWebhook),
);

// need to create /api/v1/payments/webhook

export const paymentRouter = router;
