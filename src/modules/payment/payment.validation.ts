import z from "zod";

export const createPaymentIntentSchema = z.object({
  deliveryId: z.string().uuid("Invalid delivery ID"),
});

export const codPaidSchema = z.object({
  note: z.string().max(500).optional(),
});