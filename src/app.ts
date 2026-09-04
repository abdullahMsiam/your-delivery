import express from "express";
import { prisma } from "./lib/prisma.js";
import { userRouter } from "./modules/user/user.route.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import { authRouter } from "./modules/auth/auth.route.js";

const app = express();

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

app.use("/api/v1/users", userRouter);

app.use("/api/v1/auth", authRouter);

app.use(globalErrorHandler);

export default app;
