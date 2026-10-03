import jwt from "jsonwebtoken";
import AppError from "./AppError.js";

//   const generateAccessToken = (payload: object) => {
//   const secret = process.env.JWT_ACCESS_SECRET;

//   if (!secret) {
//     throw new AppError(500, "Server configuration error");
//   }

//   const token = jwt.sign(payload, secret, {
//     expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as any,
//   });

//   return token;
// };


interface AccessTokenPayload {
  userId: string;
  email: string;
  role: "CUSTOMER" | "AGENT" | "ADMIN";
}

const generateAccessToken = (payload: AccessTokenPayload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as any || "15m",
  });
};

const verifyAccessToken = (token: string) => {
  return jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET!
  ) as AccessTokenPayload;
};


export const jwtUtils = {
  generateAccessToken,
  verifyAccessToken, 
};
