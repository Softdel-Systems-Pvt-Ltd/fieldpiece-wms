import { ClipboardPlus, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buttonVariants, Card, MonoId, ProductImage, WarrantyStatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { WarrantyCheckResult } from "../types";

export function WarrantyResultCard({ result }: { result: WarrantyCheckResult }) {
  const { t, i18n } = useTranslation();
  const signedIn = useSession((s) => s.status === "authenticated");
  const { product, serialNumber, warrantyStatus, warrantyEnd, registered } = result;
  const claimHref = `/claims/new?serial=${encodeURIComponent(serialNumber)}`;

  return (
    <Card as="article" aria-live="polite">
      <div className="flex gap-4">
        <ProductImage src={product.imageUrl} alt="" />
        <div className="min-w-0 flex-1">
          <h2 className="text-h3">{product.name}</h2>
          <p className="text-sm text-text-muted">
            {product.sku} · <MonoId>{serialNumber}</MonoId>
          </p>
          <div className="mt-2">
            <WarrantyStatusBadge status={warrantyStatus} />
          </div>
          <p className="mt-2 text-body">
            {!registered
              ? t("check.notRegistered")
              : warrantyStatus === "EXPIRED"
                ? t("check.expiredOn", { date: formatDate(warrantyEnd, i18n.language) })
                : t("check.coverageUntil", { date: formatDate(warrantyEnd, i18n.language) })}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {!registered ? (
          <Link
            to={`/registrations/new?serial=${encodeURIComponent(serialNumber)}`}
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            <ShieldCheck size={20} strokeWidth={1.75} aria-hidden />
            {t("check.registerProduct")}
          </Link>
        ) : null}
        <Link
          to={signedIn ? claimHref : "/login"}
          state={signedIn ? undefined : { from: claimHref }}
          className={buttonVariants({ variant: registered ? "primary" : "secondary", size: "lg" })}
        >
          <ClipboardPlus size={20} strokeWidth={1.75} aria-hidden />
          {t("check.fileClaim")}
        </Link>
      </div>
      {!signedIn ? <p className="mt-2 text-xs text-text-muted">{t("check.signInToClaim")}</p> : null}
    </Card>
  );
}
