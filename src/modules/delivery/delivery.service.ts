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
 


export const deliveryService = {
  createDelivery,
  getMyDeliveries,
  getMyDeliveryById,
  trackDelivery,
};
