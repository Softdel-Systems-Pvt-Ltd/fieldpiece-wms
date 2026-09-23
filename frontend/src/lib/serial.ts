import { normalizeSerial } from "./format";

// [CONFIRM] serial formats per product family with Fieldpiece.

/** Fallback pattern until Fieldpiece confirms real formats: 6-20 letters/digits/dashes. */
export const DEFAULT_SERIAL_PATTERN = "^[A-Z0-9-]{6,20}$";

export function isValidSerial(value: string, pattern: string = DEFAULT_SERIAL_PATTERN): boolean {
  return new RegExp(pattern).test(normalizeSerial(value));
}
