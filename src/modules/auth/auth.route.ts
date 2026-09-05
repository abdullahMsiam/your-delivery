import { Router } from "express";
import { authController } from "./auth.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import auth from "../../middlewares/auth.middleware.js";
import authorized from "../../middlewares/role.middleware.js";

const router = Router();

router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.get("/me", auth, asyncHandler(authController.getMe));

//temporary:
router.get(
  "/admin-test",
  auth,
  authorized("ADMIN"),
  asyncHandler(authController.adminTest),
);
export { router as authRouter };
