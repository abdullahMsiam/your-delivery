import { DeliveryStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import { notificationService } from "../notification/notification.service.js";

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

    try {
      await notificationService.createNotification({
        userId: agentId,
        type: "DELIVERY_ASSIGNED",
        title: "New Delivery Assigned",
        message: `You have been assigned delivery ${updatedDelivery.trackingId}.`,
      });
    } catch (error) {
      console.error("Failed to create assignment notification:", error);
    }

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

const getDeliveryById = async (deliveryId: string) => {
  const delivery = await prisma.delivery.findUnique({
    where: {
      id: deliveryId,
    },

    include: {
      pickupAddress: true,
      deliveryAddress: true,
      payment: true,

      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },

      agent: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },

      statusHistory: {
        orderBy: {
          createdAt: "asc",
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!delivery) {
    throw new AppError(404, "Delivery not found");
  }

  return delivery;
};

const reassignAgent = async (
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

  if (delivery.status !== "ASSIGNED") {
    throw new AppError(400, "Only assigned deliveries can be reassigned");
  }

  if (delivery.agentId === agentId) {
    throw new AppError(400, "This agent is already assigned to the delivery");
  }

  return prisma.$transaction(async (tx) => {
    const updatedDelivery = await tx.delivery.update({
      where: {
        id: deliveryId,
      },

      data: {
        agentId,

        statusHistory: {
          create: {
            status: "ASSIGNED",
            note: `Delivery reassigned to agent ${agent.name}`,
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

const cancelDelivery = async (
  deliveryId: string,
  adminId: string,
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

  if (delivery.status === "DELIVERED") {
    throw new AppError(400, "Delivered delivery cannot be cancelled");
  }

  if (delivery.status === "CANCELLED") {
    throw new AppError(400, "Delivery is already cancelled");
  }

  return prisma.$transaction(async (tx) => {
    const updatedDelivery = await tx.delivery.update({
      where: {
        id: deliveryId,
      },

      data: {
        status: "CANCELLED",

        statusHistory: {
          create: {
            status: "CANCELLED",
            note: note || "Delivery cancelled by admin",
            updatedBy: adminId,
          },
        },
      },

      include: {
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
const getAllDeliveriesInSearch = async (query: {
  page: number;
  limit: number;
  status?: DeliveryStatus;
  trackingId?: string;
  customerId?: string;
  agentId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) => {
  const {
    page,
    limit,
    status,
    trackingId,
    customerId,
    agentId,
    dateFrom,
    dateTo,
  } = query;

  const skip = (page - 1) * limit;

  const where = {
    ...(status && {
      status,
    }),

    ...(trackingId && {
      trackingId: {
        contains: trackingId,
        mode: "insensitive" as const,
      },
    }),

    ...(customerId && {
      customerId,
    }),

    ...(agentId && {
      agentId,
    }),

    ...((dateFrom || dateTo) && {
      createdAt: {
        ...(dateFrom && {
          gte: dateFrom,
        }),

        ...(dateTo && {
          lte: dateTo,
        }),
      },
    }),
  };

  const [deliveries, total] = await prisma.$transaction([
    prisma.delivery.findMany({
      where,
      skip,
      take: limit,

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

const getAgentStatistics = async (agentId: string) => {
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
    },
  });

  if (!agent) {
    throw new AppError(404, "Agent not found");
  }

  if (agent.role !== "AGENT") {
    throw new AppError(400, "User is not an agent");
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

const getDashboard = async () => {
  const [
    deliveryTotal,
    deliveryPending,
    deliveryAssigned,
    deliveryPickedUp,
    deliveryInTransit,
    deliveryOutForDelivery,
    deliveryDelivered,
    deliveryCancelled,
    deliveryFailed,

    totalCustomers,
    totalAgents,
    activeAgents,
    inactiveAgents,

    totalPayments,
    paymentPaid,
    paymentPending,
    paymentProcessing,
    paymentFailed,
    paymentCancelled,
    paymentRefunded,

    stripePayments,
    codPayments,

    paidRevenue,
    pendingRevenue,

    recentDeliveries,
    recentUsers,
  ] = await Promise.all([
    // -------------------------
    // Delivery statistics
    // -------------------------

    prisma.delivery.count(),

    prisma.delivery.count({
      where: { status: "PENDING" },
    }),

    prisma.delivery.count({
      where: { status: "ASSIGNED" },
    }),

    prisma.delivery.count({
      where: { status: "PICKED_UP" },
    }),

    prisma.delivery.count({
      where: { status: "IN_TRANSIT" },
    }),

    prisma.delivery.count({
      where: { status: "OUT_FOR_DELIVERY" },
    }),

    prisma.delivery.count({
      where: { status: "DELIVERED" },
    }),

    prisma.delivery.count({
      where: { status: "CANCELLED" },
    }),

    prisma.delivery.count({
      where: { status: "FAILED" },
    }),

    // -------------------------
    // User statistics
    // -------------------------

    prisma.user.count({
      where: { role: "CUSTOMER" },
    }),

    prisma.user.count({
      where: { role: "AGENT" },
    }),

    prisma.user.count({
      where: {
        role: "AGENT",
        isActive: true,
      },
    }),

    prisma.user.count({
      where: {
        role: "AGENT",
        isActive: false,
      },
    }),

    // -------------------------
    // Payment statistics
    // -------------------------

    prisma.payment.count(),

    prisma.payment.count({
      where: { status: "PAID" },
    }),

    prisma.payment.count({
      where: { status: "PENDING" },
    }),

    prisma.payment.count({
      where: { status: "PROCESSING" },
    }),

    prisma.payment.count({
      where: { status: "FAILED" },
    }),

    prisma.payment.count({
      where: { status: "CANCELLED" },
    }),

    prisma.payment.count({
      where: { status: "REFUNDED" },
    }),

    prisma.payment.count({
      where: { method: "STRIPE" },
    }),

    prisma.payment.count({
      where: { method: "COD" },
    }),

    // -------------------------
    // Revenue
    // -------------------------

    prisma.payment.aggregate({
      where: {
        status: "PAID",
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.payment.aggregate({
      where: {
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
      _sum: {
        amount: true,
      },
    }),

    // -------------------------
    // Recent deliveries
    // -------------------------

    prisma.delivery.findMany({
      take: 10,

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        trackingId: true,
        status: true,
        deliveryCharge: true,
        codAmount: true,
        createdAt: true,

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

        payment: {
          select: {
            method: true,
            status: true,
            amount: true,
          },
        },
      },
    }),

    // -------------------------
    // Recent users
    // -------------------------

    prisma.user.findMany({
      take: 5,

      orderBy: {
        createdAt: "desc",
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
    }),
  ]);

  return {
    deliveries: {
      total: deliveryTotal,
      pending: deliveryPending,
      assigned: deliveryAssigned,
      pickedUp: deliveryPickedUp,
      inTransit: deliveryInTransit,
      outForDelivery: deliveryOutForDelivery,
      delivered: deliveryDelivered,
      cancelled: deliveryCancelled,
      failed: deliveryFailed,
    },

    users: {
      totalCustomers,
      totalAgents,
      activeAgents,
      inactiveAgents,
    },

    payments: {
      total: totalPayments,
      paid: paymentPaid,
      pending: paymentPending,
      processing: paymentProcessing,
      failed: paymentFailed,
      cancelled: paymentCancelled,
      refunded: paymentRefunded,
      stripe: stripePayments,
      cod: codPayments,
    },

    revenue: {
      totalPaid: paidRevenue._sum.amount ?? 0,
      totalPending: pendingRevenue._sum.amount ?? 0,
    },

    recentDeliveries,
    recentUsers,
  };
};

export const adminService = {
  getAllDeliveries,
  assignAgent,
  getUsers,
  getDeliveryById,
  updateUserStatus,
  getUserById,
  updateUserRole,
  reassignAgent,
  cancelDelivery,
  getAllDeliveriesInSearch,
  getAgentStatistics,
  getDashboard,
  getAgentById: getUserById,
};
