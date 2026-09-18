import { z } from "zod";

export const assignAgentSchema = z.object({
  agentId: z.string().uuid("Invalid agent ID"),
});

export type AssignAgentInput = z.infer<
  typeof assignAgentSchema
>;