import z from "zod";

export const agentIdSchema = z.object({
  id: z.string().uuid(),
});

export const getAgentDeliveriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum([
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED",
  ]),

  note: z.string().max(500).optional(),
});

export const deliveryIdSchema = z.object({
  id: z.string().uuid(),
});
