import z from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 letter")
    .max(50, "Name can not be more than 50 letters"),

  email: z.string().email("Invalid email address").toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters"),

  phone: z
    .string()
    .min(10, "Phone number is too short")
    .max(15, "Phone number is too long"),

  // modify:
  // role: z.enum(["CUSTOMER", "AGENT", "ADMIN"]).default("CUSTOMER"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),

  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different",
    path: ["newPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;