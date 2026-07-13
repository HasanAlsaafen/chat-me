import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("The email is invalid"),
  password: z.string().min(1, "Password is required"),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  displayName: z
    .string()
    .min(2, "The name must be at least 2 characters")
    .max(50, "The name must not exceed 50 characters"),
  email: z.string().email("The email is invalid"),
  password: z
    .string()
    .min(8, "The password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});
export type RegisterForm = z.infer<typeof registerSchema>;
