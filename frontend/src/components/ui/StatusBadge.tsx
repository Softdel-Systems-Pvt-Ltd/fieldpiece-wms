import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import type { ClaimStatus, RmaStatus, WarrantyStatus } from "@/types";
import { Badge } from "./Badge";
import { claimStatusStyle, rmaStatusStyle, warrantyStatusStyle } from "./status-styles";

// Status is never shown by colour alone: every badge carries its label (Section 3.2).

interface StatusBadgeProps<S extends string> {
  status: S;
  className?: string;
}

export function ClaimStatusBadge({ status, className }: StatusBadgeProps<ClaimStatus>) {
  const { t } = useTranslation();
  return <Badge className={cn(claimStatusStyle[status], className)}>{t(`status.claim.${status}`)}</Badge>;
}

export function WarrantyStatusBadge({ status, className }: StatusBadgeProps<WarrantyStatus>) {
  const { t } = useTranslation();
  return (
    <Badge className={cn(warrantyStatusStyle[status], className)}>{t(`status.warranty.${status}`)}</Badge>
  );
}

export function RmaStatusBadge({ status, className }: StatusBadgeProps<RmaStatus>) {
  const { t } = useTranslation();
  return <Badge className={cn(rmaStatusStyle[status], className)}>{t(`status.rma.${status}`)}</Badge>;
}
