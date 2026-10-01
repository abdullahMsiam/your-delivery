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

router.patch(
  "/:deliveryId/cod-paid",
  auth,
  authorized("AGENT"),
  asyncHandler(paymentController.markCodAsPaid),
);


/* PATCH /api/v1/payments/DELIVERY_ID/cod-paid
Authorization: Bearer AGENT_ACCESS_TOKEN
Full Stack Developer with knowledge of React.js, Next.js, TypeScript, Node.js, and PostgreSQL. Built secure applications with RESTAPIs, authentication, and booking management across multiple projects, simplifying rental and delivery processes. Seeking a Full Stack Developer Intern position at Octopi Digital to develop practical web solutions

*/
// need to create /api/v1/payments/webhook

export const paymentRouter = router;
