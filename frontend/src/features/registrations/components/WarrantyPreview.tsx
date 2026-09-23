import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/format";
import { computeWarrantyEnd } from "@/lib/warranty";
import type { Product } from "@/types";

// Preview only (Section 7.2). The API's warrantyEnd always wins once the registration is saved.
// TODO: use the WarrantyPolicy for the SKU (incl. extensionMonthsOnRegistration) instead of product.warrantyMonths.

export function WarrantyPreview({ product, purchaseDate }: { product?: Product; purchaseDate?: string }) {
  const { t, i18n } = useTranslation();
  if (!product || !purchaseDate) return null;
  const end = computeWarrantyEnd(purchaseDate, { baseMonths: product.warrantyMonths });

  return (
    <p className="flex items-center gap-2 rounded bg-success-bg p-3 text-body text-success">
      <ShieldCheck size={20} strokeWidth={1.75} aria-hidden />
      {t("registrations.coveragePreview", { date: formatDate(end, i18n.language) })}
    </p>
  );
}
