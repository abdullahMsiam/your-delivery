import jwt from "jsonwebtoken";
import AppError from "./AppError.js";

const generateAccessToken = (payload: object) => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new AppError(500, "Server configuration error");
  }

  const token = jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });

  return token;
};

export const jwtUtils = {
  generateAccessToken,
};
