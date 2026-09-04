import { Router } from "express";
import { authController } from "./auth.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.post("/register", asyncHandler(authController.register));

export { router as authRouter };
