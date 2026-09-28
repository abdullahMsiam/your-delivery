import { z } from "zod";

export const assignAgentSchema = z.object({
  agentId: z.string().uuid("Invalid agent ID"),
});

export type AssignAgentInput = z.infer<typeof assignAgentSchema>;

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  role: z.enum(["CUSTOMER", "AGENT", "ADMIN"]).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["CUSTOMER", "AGENT", "ADMIN"]),
});

export const cancelDeliverySchema = z.object({
  note: z.string().max(500).optional(),
});

export const userIdSchema = z.object({
  id: z.string().uuid(),
});
