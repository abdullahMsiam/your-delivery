import { prisma } from "../../lib/prisma.js";
import generateTrackingId from "../../utils/trackingId.js";
import { CreateDeliveryInput } from "./delivery.validation.js";

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

export const deliveryService = {
  createDelivery,
};
