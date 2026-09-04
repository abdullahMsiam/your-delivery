import type { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const auth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new AppError(401, "Authorization token is required");
    }

    const token = authorization.startsWith("Bearer ")
      ? authorization.split(" ")[1]
      : null;

    if (!token) {
      throw new AppError(401, "Invalid authorization format");
    }

    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new AppError(500, "JWT secret is not configured");
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: string;
    };

    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

export default auth;
