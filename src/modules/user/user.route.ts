import { Router } from "express";
import { userController } from "./user.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import auth from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", asyncHandler(userController.getUsers));

router.get("/me", auth, asyncHandler(userController.getMyProfile));

router.patch("/me", auth, asyncHandler(userController.updateMyProfile));

export { router as userRouter };
