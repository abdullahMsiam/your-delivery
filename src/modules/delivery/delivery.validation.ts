import z from "zod";

const addressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 charecter"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  addressLine: z.string().min(5, "Address must be at least 5 charecter"),
  city: z.string().min(2, "City must be at least 2 charecter"),
  postalCode: z.string().min(3, "Postal code required"),
});

export const createDeliverySchema = z.object({
  pickupAddress: addressSchema,

  deliveryAddress: addressSchema,

  parcelType: z.string().min(2, "Parcel type is required"),

  weight: z.number().positive("Weight must be greater than 0"),

  deliveryCharge: z.number().nonnegative("Delivery charge cannot be negative"),

  codAmount: z
    .number()
    .nonnegative("COD amount cannot be negative")
    .optional()
    .default(0),

  paymentMethod: z.enum(["STRIPE", "COD"]),
});

export const myDeliveriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const cancelDeliverySchema = z.object({
  note: z.string().max(500).optional(),
});


export const getMyDeliveriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10),

  status: z
    .enum([
      "PENDING",
      "ASSIGNED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "FAILED",
    ])
    .optional(),

  trackingId: z.string().trim().optional(),

  dateFrom: z.coerce.date().optional(),

  dateTo: z.coerce.date().optional(),
});

export type MyDeliveriesQueryInput = z.infer<typeof myDeliveriesQuerySchema>;
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
