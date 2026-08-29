import { Request, Response } from "express";
import { userService } from "./user.service.js";

const getUsers = async (req: Request, res: Response) => {
  const users = await userService.getUsers();

  res.status(200).json({
    success: true,
    message: "All users retrieved successfully",
    data: users,
  });
};

export const userController = {
  getUsers,
};
