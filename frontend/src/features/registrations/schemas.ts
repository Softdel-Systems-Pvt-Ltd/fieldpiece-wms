import { z } from "zod";
import { normalizeSerial } from "@/lib/format";
import { addressSchema } from "@/lib/schemas";
import { DEFAULT_SERIAL_PATTERN } from "@/lib/serial";
import { validatePurchaseDate } from "@/lib/warranty";

// Mirrors the API's registration rules (backend Section 8.2) so users get errors before submitting.
// The API re-checks everything.

const purchaseDateMessages = {
  required: "Enter the purchase date.",
  future: "Purchase date can't be in the future.",
  beforeLaunch: "Purchase date is before this product was released. Check the receipt.",
} as const;

export const registrationSchema = z
  .object({
    serialNumber: z
      .string()
      .transform(normalizeSerial)
      .pipe(
        z
          .string()
          .min(1, "Enter the serial number.")
          .regex(
            new RegExp(DEFAULT_SERIAL_PATTERN),
            "That doesn't look like a Fieldpiece serial number. Check the label.",
          ),
      ),
    sku: z.string().min(1, "Pick the product."),
    launchDate: z.string().optional(), // from the selected product, used for validation only
    purchaseDate: z.string(),
    proofCount: z.number().int().min(0),
    requireProof: z.boolean(),
    ownerName: z.string().trim().min(1, "Enter the owner's name.").max(160),
    companyName: z.string().trim().max(160).optional(),
    ownerEmail: z.union([
      z.literal(""),
      z.string().trim().email("Enter a valid email, like name@company.com."),
    ]),
    ownerPhone: z.string().trim().max(40).optional(),
    address: addressSchema,
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "Accept the warranty terms to continue." }) }),
  })
  .superRefine((value, ctx) => {
    const problem = validatePurchaseDate(value.purchaseDate || null, { launchDate: value.launchDate });
    if (problem) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["purchaseDate"],
        message: purchaseDateMessages[problem],
      });
    }
    if (value.requireProof && value.proofCount < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proofCount"],
        message: "Upload the receipt or invoice.",
      });
    }
  });

export type RegistrationForm = z.input<typeof registrationSchema>;
export type RegistrationValues = z.output<typeof registrationSchema>;

/** API field paths -> form fields, for server-side validation errors. */
export const REGISTRATION_FIELD_MAP = {
  "customer.contactName": "ownerName",
  "customer.companyName": "companyName",
  "customer.email": "ownerEmail",
  "customer.phone": "ownerPhone",
  "customer.address.line1": "address.line1",
  "customer.address.city": "address.city",
  "customer.address.region": "address.region",
  "customer.address.postalCode": "address.postalCode",
  "customer.address.country": "address.country",
  customer: "ownerName",
  proofOfPurchaseIds: "proofCount",
} as const;

/** Detect the SKU from a serial where the pattern allows it (Section 8.3). [CONFIRM formats] */
export function detectSku(
  serial: string,
  skus: { sku: string; serialPattern?: string | null }[],
): string | null {
  const normalized = normalizeSerial(serial);
  const match = skus.find((p) =>
    p.serialPattern ? new RegExp(p.serialPattern).test(normalized) : normalized.startsWith(`${p.sku}-`),
  );
  return match?.sku ?? null;
}
