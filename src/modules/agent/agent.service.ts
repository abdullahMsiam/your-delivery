import { prisma } from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";

const getMyAgentDetails = async (agentId: string) => {
  const agent = await prisma.user.findUnique({
    where: {
      id: agentId,
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

  if (!agent) {
    throw new AppError(404, "Agent not found");
  }

  if (agent.role !== "AGENT") {
    throw new AppError(403, "User is not an agent");
  }

  return agent;
};

const getAgentStatistics = async (agentId: string) => {
  const agent = await prisma.user.findUnique({
    where: {
      id: agentId,
    },

    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!agent) {
    throw new AppError(404, "Agent not found");
  }

  if (agent.role !== "AGENT") {
    throw new AppError(403, "User is not an agent");
  }

  const [
    totalAssigned,
    assigned,
    pickedUp,
    inTransit,
    outForDelivery,
    delivered,
    failed,
    cancelled,
  ] = await Promise.all([
    prisma.delivery.count({
      where: {
        agentId,
      },
    }),

    prisma.delivery.count({
      where: {
        agentId,
        status: "ASSIGNED",
      },
    }),

    prisma.delivery.count({
      where: {
        agentId,
        status: "PICKED_UP",
      },
    }),

    prisma.delivery.count({
      where: {
        agentId,
        status: "IN_TRANSIT",
      },
    }),

    prisma.delivery.count({
      where: {
        agentId,
        status: "OUT_FOR_DELIVERY",
      },
    }),

    prisma.delivery.count({
      where: {
        agentId,
        status: "DELIVERED",
      },
    }),

    prisma.delivery.count({
      where: {
        agentId,
        status: "FAILED",
      },
    }),

    prisma.delivery.count({
      where: {
        agentId,
        status: "CANCELLED",
      },
    }),
  ]);

  const activeDeliveries = assigned + pickedUp + inTransit + outForDelivery;

  const completedDeliveries = delivered + failed;

  const successRate =
    completedDeliveries > 0
      ? Number(((delivered / completedDeliveries) * 100).toFixed(2))
      : 0;

  return {
    agent,
    statistics: {
      totalAssigned,
      activeDeliveries,
      completedDeliveries,
      delivered,
      failed,
      cancelled,

      statusBreakdown: {
        assigned,
        pickedUp,
        inTransit,
        outForDelivery,
      },

      successRate,
    },
  };
};

const getMyDeliveries = async (
  agentId: string,
  query: {
    page: number;
    limit: number;
  },
) => {
  const { page, limit } = query;

  const skip = (page - 1) * limit;

  const where = {
    agentId,
  };

  const [deliveries, total] = await prisma.$transaction([
    prisma.delivery.findMany({
      where,
      skip,
      take: limit,

      include: {
        pickupAddress: true,
        deliveryAddress: true,

        payment: {
          select: {
            id: true,
            method: true,
            status: true,
            amount: true,
            paidAt: true,
          },
        },

        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.delivery.count({
      where,
    }),
  ]);

  return {
    data: deliveries,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateDeliveryStatus = async (
  deliveryId: string,
  agentId: string,
  status:
    | "PICKED_UP"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "FAILED",
  note?: string,
) => {
  const delivery = await prisma.delivery.findUnique({
    where: {
      id: deliveryId,
    },
  });

  if (!delivery) {
    throw new AppError(404, "Delivery not found");
  }

  if (delivery.agentId !== agentId) {
    throw new AppError(403, "You are not assigned to this delivery");
  }

  const allowedTransitions: Record<string, string[]> = {
    ASSIGNED: ["PICKED_UP"],
    PICKED_UP: ["IN_TRANSIT"],
    IN_TRANSIT: ["OUT_FOR_DELIVERY"],
    OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
  };

  const allowedNextStatuses = allowedTransitions[delivery.status] ?? [];

  if (!allowedNextStatuses.includes(status)) {
    throw new AppError(
      400,
      `Cannot change delivery status from ${delivery.status} to ${status}`,
    );
  }

  const updatedDelivery = await prisma.$transaction(async (tx) => {
    const updated = await tx.delivery.update({
      where: {
        id: deliveryId,
      },

      data: {
        status,
      },

      include: {
        pickupAddress: true,
        deliveryAddress: true,

        payment: {
          select: {
            id: true,
            method: true,
            status: true,
            amount: true,
            paidAt: true,
          },
        },

        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    await tx.deliveryStatusHistory.create({
      data: {
        deliveryId,
        status,
        note,
        updatedBy: agentId,
      },
    });

    return updated;
  });

  return updatedDelivery;
};

export const agentService = {
  getMyAgentDetails,
  getAgentStatistics,
  getMyDeliveries,
  updateDeliveryStatus,
};
