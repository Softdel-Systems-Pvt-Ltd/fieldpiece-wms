import { z } from "zod";
import { normalizeSerial } from "@/lib/format";

// Section 8.4 validation rules.

export const FAILURE_CATEGORIES = [
  "no_power",
  "inaccurate_reading",
  "display",
  "connectivity",
  "physical",
  "leak",
  "other",
] as const;

/** Categories where at least one photo is required. */
export const PHOTO_REQUIRED_CATEGORIES: ReadonlySet<string> = new Set(["physical", "display"]);

export const claimSchema = z
  .object({
    serialNumber: z.string().transform(normalizeSerial).pipe(z.string().min(1, "Enter the serial number.")),
    failureCategory: z.enum(FAILURE_CATEGORIES, { message: "Pick what went wrong." }),
    failureDate: z.string().min(1, "Enter the date the unit failed."),
    description: z
      .string()
      .trim()
      .min(30, "Describe the problem in at least 30 characters so the reviewer can act on it."),
    photoCount: z.number().int().min(0),
    resolution: z.enum(["repair", "replace", "credit"], { message: "Pick your preferred resolution." }),
  })
  .superRefine((value, ctx) => {
    if (PHOTO_REQUIRED_CATEGORIES.has(value.failureCategory) && value.photoCount < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["photoCount"],
        message: "Add at least one photo of the damage or the display.",
      });
    }
    if (value.failureDate && new Date(value.failureDate) > new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["failureDate"],
        message: "Failure date can't be in the future.",
      });
    }
  });

export type ClaimDraft = z.input<typeof claimSchema>;

export const REJECTION_REASONS = [
  "out_of_warranty",
  "physical_damage",
  "misuse",
  "no_fault_found",
  "missing_proof_of_purchase",
  "other",
] as const;

export const rejectSchema = z.object({
  reason: z.enum(REJECTION_REASONS, { message: "Pick a reason." }),
  message: z.string().trim().min(10, "Write a message to the customer explaining the decision."),
});
export type RejectForm = z.infer<typeof rejectSchema>;

export const approveSchema = z.object({
  resolution: z.enum(["repair", "replace", "credit"], { message: "Pick a resolution." }),
  comment: z.string().trim().optional(),
});
export type ApproveForm = z.infer<typeof approveSchema>;
