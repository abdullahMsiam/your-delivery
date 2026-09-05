import { NextFunction, Response } from "express";
import { UserRole } from "../generated/prisma/enums.js";
import auth, { AuthenticatedRequest } from "./auth.middleware.js";
import AppError from "../utils/AppError.js";
import { User } from "../generated/prisma/client.js";

const authorized = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, "Unauthorized");
      }

      if (!allowedRoles.includes(req.user.role as UserRole)) {
        throw new AppError(
          403,
          "You don't have permission to perform this action",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authorized;
