import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, FormField, Modal, NativeSelect, Textarea } from "@/components/ui";
import { approveSchema, type ApproveForm } from "../schemas";

// Section 8.5: pick the resolution; approving creates an RMA (server side).

interface ApproveClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: ApproveForm) => void;
  pending?: boolean;
}

export function ApproveClaimModal({ open, onOpenChange, onConfirm, pending }: ApproveClaimModalProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApproveForm>({ resolver: zodResolver(approveSchema), defaultValues: { resolution: "repair" } });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("claims.actions.approve")}
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
        <FormField label="Resolution" error={errors.resolution?.message} required>
          <NativeSelect {...register("resolution")}>
            <option value="repair">Repair</option>
            <option value="replace">Replace</option>
            <option value="credit">Credit</option>
          </NativeSelect>
        </FormField>
        <FormField label="Note" helper={t("common.optional")}>
          <Textarea rows={3} {...register("comment")} />
        </FormField>
      </form>
    </Modal>
  );
}
