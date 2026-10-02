import express from "express";
import { prisma } from "./lib/prisma.js";
import { userRouter } from "./modules/user/user.route.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import { authRouter } from "./modules/auth/auth.route.js";
import { deliveryRouter } from "./modules/delivery/delivery.route.js";
import { adminRouter } from "./modules/admin/admin.route.js";
import { paymentRouter } from "./modules/payment/payment.route.js";
import asyncHandler from "./utils/asyncHandler.js";
import { paymentController } from "./modules/payment/payment.controller.js";
import { notificationRouter } from "./modules/notification/notification.route.js";

const app = express();

app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(paymentController.handleStripeWebhook)
);


app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Your Delivery API is running",
      database: "connected",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Your Delivery API",
  });
});

app.use("/api/v1/users", userRouter);

app.use("/api/v1/auth", authRouter);

app.use("/api/v1/deliveries", deliveryRouter);

app.use("/api/v1/admin", adminRouter); 

app.use("/api/v1/payments", paymentRouter);

app.use("/api/v1/notifications", notificationRouter);

app.use(globalErrorHandler);

export default app;
