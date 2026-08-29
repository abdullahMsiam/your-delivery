import { Router } from "express";
import { userController } from "./user.controller.js";

const router = Router();

router.get("/", userController.getUsers);

export default router;
