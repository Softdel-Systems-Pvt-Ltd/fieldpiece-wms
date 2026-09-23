import { z } from "zod";

export const devSignInSchema = z.object({
  email: z.string().min(1, "Pick an account to sign in as."),
});
export type DevSignInForm = z.infer<typeof devSignInSchema>;
