import { Request, Response } from "express";
import { registerSchema } from "./auth.validation.js";
import { authService } from "./auth.service.js";
import { success } from "zod";

const register = async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);
  const user = await authService.register(validatedData);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
  });
};

export const authController = {
  register,
};
