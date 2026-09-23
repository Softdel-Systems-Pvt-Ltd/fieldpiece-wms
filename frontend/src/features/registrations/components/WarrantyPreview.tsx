import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/format";
import { computeWarrantyEnd } from "@/lib/warranty";
import type { Product } from "@/types";

// Preview only (Section 7.2). Assumes registration now, within any bonus window; the API's warrantyEnd
// (from the policy in effect on the purchase date) always wins once the registration is saved.

export function WarrantyPreview({ product, purchaseDate }: { product?: Product; purchaseDate?: string }) {
  const { t, i18n } = useTranslation();
  if (!product?.warrantyMonths || !purchaseDate) return null;
  const end = computeWarrantyEnd(purchaseDate, {
    baseMonths: product.warrantyMonths,
    registrationBonusMonths: product.registrationBonusMonths,
  });

  return (
    <p className="flex items-center gap-2 rounded bg-success-bg p-3 text-body text-success">
      <ShieldCheck size={20} strokeWidth={1.75} aria-hidden />
      {t("registrations.coveragePreview", { date: formatDate(end, i18n.language) })}
    </p>
  );
}
