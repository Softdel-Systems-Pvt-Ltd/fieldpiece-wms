import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, FormField, Modal, Textarea } from "@/components/ui";
import { messageSchema, type MessageForm, optionalMessageSchema } from "../schemas";

/** Collects the message for request-info, respond and close. */
interface MessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string | undefined) => void;
  title: string;
  label: string;
  confirmLabel: string;
  required: boolean;
  pending?: boolean;
}

export function MessageModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  label,
  confirmLabel,
  required,
  pending,
}: MessageModalProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageForm>({ resolver: zodResolver(required ? messageSchema : optionalMessageSchema) });

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="claim-message" loading={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form
        id="claim-message"
        noValidate
        onSubmit={handleSubmit(({ message }) => onConfirm(message || undefined))}
        className="space-y-4"
      >
        <FormField
          label={label}
          error={errors.message?.message}
          required={required}
          helper={required ? undefined : t("common.optional")}
        >
          <Textarea rows={5} {...register("message")} />
        </FormField>
      </form>
    </Modal>
  );
}
