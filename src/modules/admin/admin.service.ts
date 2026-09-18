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

export const adminService = {
  getAllDeliveries,
  assignAgent,
};
