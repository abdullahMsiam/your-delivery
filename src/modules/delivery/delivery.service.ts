import { prisma } from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";
import generateTrackingId from "../../utils/trackingId.js";
import {
  CreateDeliveryInput,
  MyDeliveriesQueryInput,
} from "./delivery.validation.js";

const createDelivery = async (
  customerId: string,
  data: CreateDeliveryInput,
) => {
  const delivery = await prisma.$transaction(async (tx) => {
    const pickupAddress = await tx.address.create({
      data: data.pickupAddress,
    });

    const deliveryAddress = await tx.address.create({
      data: data.deliveryAddress,
    });

    const createdDelivery = await tx.delivery.create({
      data: {
        trackingId: generateTrackingId(),

        customerId,

        pickupAddressId: pickupAddress.id,
        deliveryAddressId: deliveryAddress.id,

        parcelType: data.parcelType,
        weight: data.weight,
        deliveryCharge: data.deliveryCharge,
        codAmount: data.codAmount,

        status: "PENDING",

        payment: {
          create: {
            method: data.paymentMethod,
            status: "PENDING",
            amount: data.deliveryCharge,
          },
        },

        statusHistory: {
          create: {
            status: "PENDING",
            note: "Delivery created",
            updatedBy: customerId,
          },
        },
      },

      include: {
        pickupAddress: true,
        deliveryAddress: true,
        statusHistory: true,
        payment: true,
      },
    });

    return createdDelivery;
  });

  return delivery;
};
const getMyDeliveries = async (
  customerId: string,
  query: MyDeliveriesQueryInput,
) => {
  const { page, limit } = query;

  const skip = (page - 1) * limit;

  const [deliveries, total] = await prisma.$transaction([
    prisma.delivery.findMany({
      where: {
        customerId,
      },

      skip,
      take: limit,

      orderBy: {
        createdAt: "desc",
      },

      include: {
        pickupAddress: true,
        deliveryAddress: true,
        payment: true,
        statusHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    }),

    prisma.delivery.count({
      where: {
        customerId,
      },
    }),
  ]);

  return {
    deliveries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getMyDeliveryById = async (
  customerId: string,
  deliveryId: string,
) => {
  const delivery = await prisma.delivery.findFirst({
    where: {
      id: deliveryId,
      customerId,
    },

    include: {
      pickupAddress: true,
      deliveryAddress: true,
      payment: true,

      statusHistory: {
        orderBy: {
          createdAt: "asc",
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

  if (!delivery) {
    throw new AppError(404, "Delivery not found");
  }

  return delivery;
};

const trackDelivery = async (trackingId: string) => {
  const delivery = await prisma.delivery.findUnique({
    where: {
      trackingId,
    },

    select: {
      trackingId: true,
      status: true,
      parcelType: true,
      weight: true,
      createdAt: true,
      updatedAt: true,

      pickupAddress: {
        select: {
          city: true,
          postalCode: true,
        },
      },

      deliveryAddress: {
        select: {
          city: true,
          postalCode: true,
        },
      },

      statusHistory: {
        orderBy: {
          createdAt: "asc",
        },

        select: {
          status: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });

  if (!delivery) {
    throw new AppError(404, "Delivery not found");
  }

  return delivery;
};

const getDeliveryHistory = async (
  deliveryId: string,
  customerId: string,
) => {
  const delivery = await prisma.delivery.findUnique({
    where: {
      id: deliveryId,
    },
    select: {
      id: true,
      trackingId: true,
      customerId: true,
    },
  });

  if (!delivery) {
    throw new AppError(404, "Delivery not found");
  }

  if (delivery.customerId !== customerId) {
    throw new AppError(
      403,
      "You are not allowed to view this delivery history",
    );
  }

  const history = await prisma.deliveryStatusHistory.findMany({
    where: {
      deliveryId,
    },
    select: {
      id: true,
      status: true,
      note: true,
      createdAt: true,

      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return {
    deliveryId: delivery.id,
    trackingId: delivery.trackingId,
    history,
  };
};

const cancelDelivery = async (
  deliveryId: string,
  customerId: string,
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

  if (delivery.customerId !== customerId) {
    throw new AppError(
      403,
      "You are not allowed to cancel this delivery",
    );
  }

  if (
    delivery.status !== "PENDING" &&
    delivery.status !== "ASSIGNED"
  ) {
    throw new AppError(
      400,
      `Delivery cannot be cancelled when status is ${delivery.status}`,
    );
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
            note: note || "Delivery cancelled by customer",
            updatedBy: customerId,
          },
        },
      },

      include: {
        pickupAddress: true,
        deliveryAddress: true,

        payment: true,

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
 


export const deliveryService = {
  createDelivery,
  getMyDeliveries,
  getMyDeliveryById,
  trackDelivery,
  getDeliveryHistory, 
  cancelDelivery, 
  

};
