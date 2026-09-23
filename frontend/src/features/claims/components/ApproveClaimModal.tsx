import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, FormField, Modal, NativeSelect, Textarea } from "@/components/ui";
import type { Resolution } from "@/types";
import { approveSchema, type ApproveForm } from "../schemas";

// Section 8.5: pick the resolution; approving issues the RMA on the server in the same transaction.

interface ApproveClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: ApproveForm) => void;
  pending?: boolean;
  preferred?: Resolution | null;
}

export function ApproveClaimModal({
  open,
  onOpenChange,
  onConfirm,
  pending,
  preferred,
}: ApproveClaimModalProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApproveForm>({
    resolver: zodResolver(approveSchema),
    values: { resolution: preferred ?? "repair" },
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("claims.actions.approve")}
      description={t("claims.approveHelp")}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="approve-claim" loading={pending}>
            {t("claims.actions.approve")}
          </Button>
        </>
      }
    >
      <form id="approve-claim" noValidate onSubmit={handleSubmit(onConfirm)} className="space-y-4">
        <FormField label={t("claims.resolution")} error={errors.resolution?.message} required>
          <NativeSelect {...register("resolution")}>
            {(["repair", "replace", "credit"] as const).map((r) => (
              <option key={r} value={r}>
                {t(`claims.resolutions.${r}`)}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label={t("claims.note")} helper={t("common.optional")}>
          <Textarea rows={3} {...register("comment")} />
        </FormField>
      </form>
    </Modal>
  );
}
