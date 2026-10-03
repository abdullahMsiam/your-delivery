import { Router } from "express";
import { authController } from "./auth.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import auth from "../../middlewares/auth.middleware.js";
import authorized from "../../middlewares/role.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  asyncHandler(authController.register),
);
router.post("/login", authRateLimiter, asyncHandler(authController.login));
router.get("/me", auth, asyncHandler(authController.getMe));

router.patch(
  "/change-password",
  auth,
  authRateLimiter,
  asyncHandler(authController.changePassword),
);

router.post(
  "/refresh-token",
  authRateLimiter,
  asyncHandler(authController.refreshAccessToken),
);

router.post("/logout", asyncHandler(authController.logout));

//temporary:
router.get(
  "/admin-test",
  auth,
  authorized("ADMIN"),
  asyncHandler(authController.adminTest),
);
export { router as authRouter };
