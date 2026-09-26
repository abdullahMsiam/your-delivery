import { Request, Response } from "express";
import { userService } from "./user.service.js";
import AppError from "../../utils/AppError.js";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";

const getUsers = async (req: Request, res: Response) => {
  const users = await userService.getUsers();

  if (!users.length) {
    throw new AppError(404, "No user found");
  }

  res.status(200).json({
    success: true,
    message: "All users retrieved successfully",
    data: users,
  });
};

const getMyProfile = async (req: AuthenticatedRequest, res: Response) => {
  const user = await userService.getMyProfile(req.user?.userId as string);

  res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: user,
  });
};


const updateMyProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const user = await userService.updateMyProfile(
    req.user?.userId as string,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
};

export const userController = {
  getUsers,
  getMyProfile,
  updateMyProfile,
};
