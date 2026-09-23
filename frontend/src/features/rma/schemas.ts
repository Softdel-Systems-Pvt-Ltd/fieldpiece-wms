import { z } from "zod";

export const inspectionSchema = z.object({
  findings: z.string().trim().min(10, "Describe what you found during inspection."),
  rootCause: z.string().min(1, "Pick a root cause."),
  partsUsed: z.array(z.string()).default([]),
  outcome: z.enum(["repaired", "replaced", "scrapped"], { message: "Pick the outcome." }),
  replacementSerial: z.string().trim().optional(),
});
export type InspectionForm = z.infer<typeof inspectionSchema>;
