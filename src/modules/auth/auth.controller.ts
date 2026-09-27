import { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.validation.js";
import { authService } from "./auth.service.js";
import { success } from "zod";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import AppError from "../../utils/AppError.js";

const register = async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);
  const user = await authService.register(validatedData);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
  });
};

const login = async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);

  const result = await authService.login(validatedData);

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: result,
  });
};

const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Unauthorized");
  }

  const user = await authService.getMe(req.user.userId);

  res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
};

// temporary:
const adminTest = async (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome Admin",
  });
};

const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(
    req.user?.userId as string,
    currentPassword,
    newPassword,
  );

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};

const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError(400, "Refresh token is required");
  }

  await authService.logout(refreshToken);

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError(400, "Refresh token is required");
  }

  const result = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    message: "Access token refreshed successfully",
    data: result,
  });
};

export const authController = {
  register,
  login,
  getMe,
  logout,
  adminTest,
  changePassword,
  refreshAccessToken,
};
