import { prisma } from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";

const getAllDeliveries = async () => {
  return prisma.delivery.findMany({
    orderBy: {
      createdAt: "desc",
    },

    include: {
      pickupAddress: true,
      deliveryAddress: true,
      payment: true,

      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },

      agent: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });
};

const assignAgent = async (
  deliveryId: string,
  agentId: string,
  adminId: string,
) => {
  const agent = await prisma.user.findFirst({
    where: {
      id: agentId,
      role: "AGENT",
      isActive: true,
    },
  });

  if (!agent) {
    throw new AppError(404, "Active agent not found");
  }

  const delivery = await prisma.delivery.findUnique({
    where: {
      id: deliveryId,
    },
  });

  if (!delivery) {
    throw new AppError(404, "Delivery not found");
  }

  if (delivery.status !== "PENDING") {
    throw new AppError(400, "Only pending deliveries can be assigned");
  }

  return prisma.$transaction(async (tx) => {
    const updatedDelivery = await tx.delivery.update({
      where: {
        id: deliveryId,
      },

      data: {
        agentId,
        status: "ASSIGNED",

        statusHistory: {
          create: {
            status: "ASSIGNED",
            note: "Agent assigned by admin",
            updatedBy: adminId,
          },
        },
      },

      include: {
        agent: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },

        statusHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return updatedDelivery;
  });
};

const getUsers = async (query: {
  page: number;
  limit: number;
  role?: "CUSTOMER" | "AGENT" | "ADMIN";
  isActive?: boolean;
}) => {
  const { page, limit, role, isActive } = query;

  const skip = (page - 1) * limit;

  const where = {
    ...(role && { role }),
    ...(isActive !== undefined && { isActive }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
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
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getUserById = async (userId: string) => {
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

const updateUserStatus = async (
  userId: string,
  adminId: string,
  isActive: boolean,
) => {
  if (userId === adminId) {
    throw new AppError(400, "You cannot change your own account status");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isActive,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const updateUserRole = async (
  userId: string,
  adminId: string,
  role: "CUSTOMER" | "AGENT" | "ADMIN",
) => {
  if (userId === adminId) {
    throw new AppError(400, "You cannot change your own role");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

export const adminService = {
  getAllDeliveries,
  assignAgent,
  getUsers,
  updateUserStatus,
  getUserById,
  updateUserRole,
  
};
