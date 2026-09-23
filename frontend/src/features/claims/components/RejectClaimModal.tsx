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

// TODO: move reason labels into locale files once the client confirms the list.
const reasonLabel: Record<(typeof REJECTION_REASONS)[number], string> = {
  out_of_warranty: "Out of warranty",
  physical_damage: "Physical damage not covered",
  misuse: "Misuse or improper use",
  no_fault_found: "No fault found",
  missing_proof_of_purchase: "Missing proof of purchase",
  other: "Other",
};

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
        <FormField label="Reason" error={errors.reason?.message} required>
          <NativeSelect defaultValue="" {...register("reason")}>
            <option value="" disabled>
              Pick a reason
            </option>
            {REJECTION_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reasonLabel[reason]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Message to the customer" error={errors.message?.message} required>
          <Textarea rows={5} {...register("message")} />
        </FormField>
      </form>
    </Modal>
  );
}
