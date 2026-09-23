import { z } from "zod";

// Admin product editing. warrantyMonths is read-only here: it comes from WarrantyPolicy.
export const productSchema = z.object({
  name: z.string().trim().min(1, "Enter the product name."),
  serialPattern: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true;
      try {
        new RegExp(value);
        return true;
      } catch {
        return false;
      }
    }, "That isn't a valid pattern. Check the regular expression."),
  launchDate: z.string().optional(),
});
export type ProductForm = z.infer<typeof productSchema>;
