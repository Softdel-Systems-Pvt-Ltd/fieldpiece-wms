import { z } from "zod";
import { normalizeSerial } from "@/lib/format";

export const ROOT_CAUSES = [
  "component_failure",
  "firmware",
  "calibration",
  "physical_damage",
  "water_damage",
  "no_fault_found",
  "other",
] as const;

const tracking = z.string().trim().min(4, "Enter the tracking number.").max(40);

export const shipSchema = z.object({
  trackingNumber: tracking,
  carrier: z.string().trim().max(30).optional(),
});
export type ShipForm = z.infer<typeof shipSchema>;

export const inspectSchema = z.object({
  findings: z.string().trim().min(10, "Describe what you found.").max(5000),
  rootCause: z.enum(ROOT_CAUSES, { message: "Pick a root cause." }),
  partsUsed: z.string().trim().max(500).optional(), // comma-separated in the form
});
export type InspectForm = z.infer<typeof inspectSchema>;

export const completeSchema = (type: "repair" | "replace" | "credit") =>
  z
    .object({
      outboundTracking: z.union([z.literal(""), tracking]).optional(),
      replacementSerial: z.string().optional(),
      creditAmount: z.string().optional(),
    })
    .superRefine((v, ctx) => {
      if (type === "replace" && !normalizeSerial(v.replacementSerial ?? "")) {
        ctx.addIssue({
          code: "custom",
          path: ["replacementSerial"],
          message: "Enter the replacement unit's serial number.",
        });
      }
      if (type === "credit" && !(Number(v.creditAmount) > 0)) {
        ctx.addIssue({ code: "custom", path: ["creditAmount"], message: "Enter the credit amount." });
      }
    });
export type CompleteForm = z.infer<ReturnType<typeof completeSchema>>;

export const cancelSchema = z.object({
  reason: z.string().trim().min(5, "Say why the RMA is cancelled.").max(1000),
});
export type CancelForm = z.infer<typeof cancelSchema>;
