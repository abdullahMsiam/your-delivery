import { prisma } from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";

const getUsers = async () => {
  return prisma.user.findMany({
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
};

const getMyProfile = async (userId: string) => {
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

const updateMyProfile = async (
  userId: string,
  data: {
    name?: string;
    phone?: string;
  },
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (data.phone && data.phone !== user.phone) {
    const existingUser = await prisma.user.findUnique({
      where: {
        phone: data.phone,
      },
    });

    if (existingUser) {
      throw new AppError(409, "Phone number already exists");
    }
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data,
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
};

export const userService = {
  getUsers,
  getMyProfile,
  updateMyProfile,
};
