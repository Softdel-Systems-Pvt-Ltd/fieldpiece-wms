import { z } from "zod";

export const reportFiltersSchema = z
  .object({
    from: z.string().min(1, "Pick a start date."),
    to: z.string().min(1, "Pick an end date."),
    sku: z.string().optional(),
    family: z.string().optional(),
    region: z.string().optional(),
    distributorId: z.string().optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    path: ["to"],
    message: "End date must be after the start date.",
  });
