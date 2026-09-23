import { z } from "zod";

/** Comma-separated list in a text input -> array (done on submit, so the form keeps plain strings). */
export const splitList = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const policySchema = z
  .object({
    sku: z.string().trim().toUpperCase().optional(),
    baseMonths: z.coerce.number().int().min(0, "Can't be negative.").max(240),
    registrationBonusMonths: z.coerce.number().int().min(0).max(120),
    registrationWindowDays: z.union([z.literal(""), z.coerce.number().int().min(0).max(3650)]),
    coverage: z.string().optional(),
    exclusions: z.string().optional(),
    effectiveFrom: z.string().min(1, "Pick the date this policy starts."),
    effectiveTo: z.string().optional(),
  })
  .refine((v) => !v.effectiveTo || v.effectiveTo > v.effectiveFrom, {
    path: ["effectiveTo"],
    message: "Must be after the start date.",
  });

export type PolicyFormInput = z.input<typeof policySchema>;
export type PolicyFormValues = z.output<typeof policySchema>;
