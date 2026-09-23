import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Enter the customer name."),
  email: z.string().trim().email("Enter a valid email, like name@company.com."),
  phone: z.string().trim().optional(),
});
export type CustomerForm = z.infer<typeof customerSchema>;
