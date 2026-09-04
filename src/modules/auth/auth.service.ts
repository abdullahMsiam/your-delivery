import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { LoginInput, RegisterInput } from "./auth.validation.js";
import AppError from "../../utils/AppError.js";
import { jwtUtils } from "../../utils/jwt.js";

const register = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { phone: data.phone }],
    },
  });

  if (existingUser) {
    if (existingUser.email === data.email) {
      throw new AppError(409, "Email already registered");
    }

    if (existingUser.phone) {
      throw new AppError(409, "Phone number already registered");
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      role: "CUSTOMER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
};

const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user) {
    throw new AppError(401, "Invalid credentials");
  }

  if (!user.isActive) {
    throw new AppError(403, "Your account is not active");
  }

  const isPasswordMatched = await bcrypt.compare(data.password, user.password);

  if (!isPasswordMatched) {
    throw new AppError(401, "Invalid credentials");
  }

  const accessToken = jwtUtils.generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
  };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

export const authService = {
  register,
  login,
  getMe,
};
