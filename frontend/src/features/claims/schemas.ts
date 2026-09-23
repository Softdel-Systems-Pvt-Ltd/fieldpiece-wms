import { z } from "zod";
import { normalizeSerial } from "@/lib/format";
import { addressSchema } from "@/lib/schemas";

// Section 8.4 rules, mirroring the API's validation. The API re-checks everything.

/**
 * Builds the claim form schema. Which categories need a photo comes from the API (failure categories are
 * admin-editable), so the schema is created per render with that set.
 */
export function makeClaimSchema(photoRequired: ReadonlySet<string>) {
  return z
    .object({
      serialNumber: z.string().transform(normalizeSerial).pipe(z.string().min(1, "Enter the serial number.")),
      failureCategory: z.string().min(1, "Pick what went wrong."),
      failureDate: z.string().min(1, "Enter the date the unit failed."),
      description: z
        .string()
        .trim()
        .min(30, "Describe the problem in at least 30 characters so the reviewer can act on it.")
        .max(5000),
      photoCount: z.number().int().min(0),
      preferredResolution: z.enum(["repair", "replace", "credit"], {
        message: "Pick your preferred resolution.",
      }),
      returnAddress: addressSchema,
    })
    .superRefine((value, ctx) => {
      if (photoRequired.has(value.failureCategory) && value.photoCount < 1) {
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
}

export type ClaimForm = z.input<ReturnType<typeof makeClaimSchema>>;
export type ClaimValues = z.output<ReturnType<typeof makeClaimSchema>>;

/** The subset the API needs to accept a draft (DB constraints), for autosave. */
export const draftReadySchema = z.object({
  serialNumber: z.string().min(3),
  failureCategory: z.string().min(1),
  failureDate: z.string().min(1),
  description: z.string().trim().min(30),
});

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
  message: z.string().trim().min(10, "Write a message to the customer explaining the decision.").max(5000),
});
export type RejectForm = z.infer<typeof rejectSchema>;

export const approveSchema = z.object({
  resolution: z.enum(["repair", "replace", "credit"], { message: "Pick a resolution." }),
  comment: z.string().trim().max(5000).optional(),
});
export type ApproveForm = z.infer<typeof approveSchema>;

export const messageSchema = z.object({ message: z.string().trim().min(1, "Write a message.").max(5000) });
export const optionalMessageSchema = z.object({ message: z.string().trim().max(5000).optional() });
export type MessageForm = z.infer<typeof optionalMessageSchema>;
