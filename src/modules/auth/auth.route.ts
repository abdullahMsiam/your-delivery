import { Router } from "express";
import { authController } from "./auth.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import auth from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.get("/me", auth, asyncHandler(authController.getMe));

export { router as authRouter };
