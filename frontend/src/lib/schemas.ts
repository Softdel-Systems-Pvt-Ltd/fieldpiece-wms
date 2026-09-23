import { z } from "zod";

// Shared form schemas mirroring the API's validation (backend common/validation/schemas.ts).

export const addressSchema = z.object({
  line1: z.string().trim().min(1, "Enter the street address.").max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1, "Enter the city.").max(100),
  region: z.string().trim().min(1, "Enter the state or province.").max(100),
  postalCode: z.string().trim().min(1, "Enter the postal code.").max(20),
  country: z
    .string()
    .trim()
    .length(2, "Use the 2-letter country code, e.g. US.")
    .transform((c) => c.toUpperCase()),
});
export type AddressInput = z.input<typeof addressSchema>;

export const emptyAddress: AddressInput = {
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "US",
};

/** Drops empty optional strings so the API gets `undefined`, not "". */
export function withoutBlank<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== "")) as T;
}
