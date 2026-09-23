import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, FormField, Modal, NativeSelect, Textarea } from "@/components/ui";
import { REJECTION_REASONS, rejectSchema, type RejectForm } from "../schemas";

// Section 8.5: a reason (from a list) and a message to the customer are both required.

interface RejectClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: RejectForm) => void;
  pending?: boolean;
}

export function RejectClaimModal({ open, onOpenChange, onConfirm, pending }: RejectClaimModalProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RejectForm>({ resolver: zodResolver(rejectSchema) });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("claims.actions.reject")}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" type="submit" form="reject-claim" loading={pending}>
            {t("claims.actions.reject")}
          </Button>
        </>
      }
    >
      <form id="reject-claim" noValidate onSubmit={handleSubmit(onConfirm)} className="space-y-4">
        <FormField label={t("claims.rejectReason")} error={errors.reason?.message} required>
          <NativeSelect defaultValue="" {...register("reason")}>
            <option value="" disabled>
              {t("claims.pickReason")}
            </option>
            {REJECTION_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {t(`claims.rejectionReasons.${reason}`)}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label={t("claims.messageToCustomer")} error={errors.message?.message} required>
          <Textarea rows={5} {...register("message")} />
        </FormField>
      </form>
    </Modal>
  );
}
