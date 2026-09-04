import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { RegisterInput } from "./auth.validation.js";
import AppError from "../../utils/AppError.js";

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

export const authService = {
  register,
};
