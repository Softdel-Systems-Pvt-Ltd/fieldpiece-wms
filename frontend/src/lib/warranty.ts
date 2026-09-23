import {
  addMonths,
  differenceInCalendarDays,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import type { RegistrationStatus, WarrantyPolicy } from "@/types";

// Warranty date maths (Section 7.2). This is a PREVIEW only: the API's value always wins.
// Mirrors the backend engine (backend Section 8.1): coverage ends the day before the anniversary, and the
// registration bonus applies when registering now. Durations come from the policy, never hard-coded.

type PolicyTerms = Pick<WarrantyPolicy, "baseMonths"> & { registrationBonusMonths?: number | null };

const toDate = (value: string | Date) => (typeof value === "string" ? parseISO(value) : value);

export function computeWarrantyEnd(purchaseDate: string | Date, policy: PolicyTerms): Date {
  return subDays(
    addMonths(toDate(purchaseDate), policy.baseMonths + (policy.registrationBonusMonths ?? 0)),
    1,
  );
}

export interface WarrantyStatusOptions {
  now?: Date;
  expiringSoonDays?: number; // Section 5.3: 60 days by default, configurable
  void?: boolean;
}

export function getWarrantyStatus(
  warrantyEnd: string | Date,
  { now = new Date(), expiringSoonDays = 60, void: isVoid = false }: WarrantyStatusOptions = {},
): RegistrationStatus {
  if (isVoid) return "VOID";
  const end = startOfDay(toDate(warrantyEnd));
  const today = startOfDay(now);
  if (isBefore(end, today)) return "EXPIRED";
  if (differenceInCalendarDays(end, today) <= expiringSoonDays) return "EXPIRING_SOON";
  return "ACTIVE";
}

export function daysRemaining(warrantyEnd: string | Date, now = new Date()): number {
  return Math.max(0, differenceInCalendarDays(startOfDay(toDate(warrantyEnd)), startOfDay(now)));
}

export type PurchaseDateError = "required" | "future" | "beforeLaunch";

/** Section 5.2: purchase date can't be in the future or before the product's launch date. */
export function validatePurchaseDate(
  purchaseDate: string | Date | null | undefined,
  { launchDate, now = new Date() }: { launchDate?: string; now?: Date } = {},
): PurchaseDateError | null {
  if (!purchaseDate) return "required";
  const date = startOfDay(toDate(purchaseDate));
  if (isAfter(date, startOfDay(now))) return "future";
  if (launchDate && isBefore(date, startOfDay(parseISO(launchDate)))) return "beforeLaunch";
  return null;
}
