import z from "zod";

export const createPaymentIntentSchema = z.object({
  deliveryId: z.string().uuid("Invalid delivery ID"),
});