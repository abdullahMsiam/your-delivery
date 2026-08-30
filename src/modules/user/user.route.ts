import { Router } from "express";
import { userController } from "./user.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(userController.getUsers));

export default router;
