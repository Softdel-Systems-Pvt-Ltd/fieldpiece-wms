import { z } from "zod";

export const policySchema = z.object({
  sku: z.string().min(1, "Pick a SKU, or * for all products."),
  baseMonths: z.coerce.number().int().min(1, "Warranty must be at least 1 month."),
  extensionMonthsOnRegistration: z.coerce.number().int().min(0).optional(),
  coverage: z.array(z.string()).min(1, "Add at least one coverage item."),
  exclusions: z.array(z.string()),
  effectiveFrom: z.string().min(1, "Pick the date this policy starts."),
});
export type PolicyForm = z.infer<typeof policySchema>;

export const settingsSchema = z.object({
  expiringSoonDays: z.coerce.number().int().min(1).max(365),
  slaHours: z.object({
    review: z.coerce.number().int().min(1),
    rmaTurnaround: z.coerce.number().int().min(1),
  }),
});
