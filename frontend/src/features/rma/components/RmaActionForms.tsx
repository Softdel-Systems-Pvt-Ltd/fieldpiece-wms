import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, FormField, Input, Modal, NativeSelect, SerialNumberInput, Textarea } from "@/components/ui";
import { normalizeSerial } from "@/lib/format";
import type { Rma } from "@/types";
import {
  cancelSchema,
  type CancelForm,
  completeSchema,
  type CompleteForm,
  inspectSchema,
  type InspectForm,
  ROOT_CAUSES,
  shipSchema,
  type ShipForm,
} from "../schemas";
import type { CompleteRequest, InspectRequest, ShipInboundRequest } from "../types";

interface FormModalProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: T) => void;
  pending?: boolean;
}

function Footer({
  formId,
  label,
  pending,
  onCancel,
  danger,
}: {
  formId: string;
  label: string;
  pending?: boolean;
  onCancel: () => void;
  danger?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Button variant="secondary" onClick={onCancel}>
        {t("common.cancel")}
      </Button>
      <Button type="submit" form={formId} loading={pending} variant={danger ? "danger" : "primary"}>
        {label}
      </Button>
    </>
  );
}

/** Customer or service center records the inbound shipment. The carrier is detected when left blank. */
export function ShipInboundModal({
  open,
  onOpenChange,
  onConfirm,
  pending,
}: FormModalProps<ShipInboundRequest>) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShipForm>({ resolver: zodResolver(shipSchema) });
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("rma.actions.shipInbound")}
      footer={
        <Footer
          formId="rma-ship"
          label={t("rma.actions.shipInbound")}
          pending={pending}
          onCancel={() => onOpenChange(false)}
        />
      }
    >
      <form
        id="rma-ship"
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((v) =>
          onConfirm({ trackingNumber: v.trackingNumber, carrier: v.carrier || undefined }),
        )}
      >
        <FormField label={t("rma.trackingNumber")} error={errors.trackingNumber?.message} required>
          <Input className="font-mono" {...register("trackingNumber")} />
        </FormField>
        <FormField label={t("rma.carrier")} helper={t("rma.carrierHelp")}>
          <Input {...register("carrier")} />
        </FormField>
      </form>
    </Modal>
  );
}

export function InspectModal({ open, onOpenChange, onConfirm, pending }: FormModalProps<InspectRequest>) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InspectForm>({ resolver: zodResolver(inspectSchema) });
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("rma.actions.inspect")}
      footer={
        <Footer
          formId="rma-inspect"
          label={t("rma.actions.inspect")}
          pending={pending}
          onCancel={() => onOpenChange(false)}
        />
      }
    >
      <form
        id="rma-inspect"
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((v) =>
          onConfirm({
            findings: v.findings,
            rootCause: v.rootCause,
            partsUsed: (v.partsUsed ?? "")
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean),
          }),
        )}
      >
        <FormField label={t("rma.findings")} error={errors.findings?.message} required>
          <Textarea rows={4} {...register("findings")} />
        </FormField>
        <FormField label={t("rma.rootCause")} error={errors.rootCause?.message} required>
          <NativeSelect defaultValue="" {...register("rootCause")}>
            <option value="" disabled>
              —
            </option>
            {ROOT_CAUSES.map((c) => (
              <option key={c} value={c}>
                {t(`rma.rootCauses.${c}`)}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label={t("rma.partsUsed")} helper={t("rma.partsUsedHelp")}>
          <Input {...register("partsUsed")} />
        </FormField>
      </form>
    </Modal>
  );
}

export function CompleteModal({
  open,
  onOpenChange,
  onConfirm,
  pending,
  rma,
}: FormModalProps<CompleteRequest> & { rma: Rma }) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteForm>({ resolver: zodResolver(completeSchema(rma.type)) });
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("rma.actions.complete")}
      description={t(`rma.completeHelp.${rma.type}`)}
      footer={
        <Footer
          formId="rma-complete"
          label={t("rma.actions.complete")}
          pending={pending}
          onCancel={() => onOpenChange(false)}
        />
      }
    >
      <form
        id="rma-complete"
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((v) =>
          onConfirm({
            outboundTracking: v.outboundTracking || undefined,
            replacementSerial:
              rma.type === "replace" ? normalizeSerial(v.replacementSerial ?? "") : undefined,
            creditAmount: rma.type === "credit" ? Number(v.creditAmount) : undefined,
          }),
        )}
      >
        {rma.type === "replace" ? (
          <FormField label={t("rma.replacementSerial")} error={errors.replacementSerial?.message} required>
            <SerialNumberInput {...register("replacementSerial")} />
          </FormField>
        ) : null}
        {rma.type === "credit" ? (
          <FormField label={t("rma.creditAmount")} error={errors.creditAmount?.message} required>
            <Input type="number" min="0" step="0.01" inputMode="decimal" {...register("creditAmount")} />
          </FormField>
        ) : null}
        {rma.type !== "credit" ? (
          <FormField
            label={t("rma.outboundTracking")}
            error={errors.outboundTracking?.message}
            helper={t("common.optional")}
          >
            <Input className="font-mono" {...register("outboundTracking")} />
          </FormField>
        ) : null}
      </form>
    </Modal>
  );
}

export function CancelModal({ open, onOpenChange, onConfirm, pending }: FormModalProps<CancelForm>) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelForm>({ resolver: zodResolver(cancelSchema) });
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("rma.actions.cancel")}
      description={t("rma.cancelHelp")}
      footer={
        <Footer
          formId="rma-cancel"
          label={t("rma.actions.cancel")}
          pending={pending}
          onCancel={() => onOpenChange(false)}
          danger
        />
      }
    >
      <form id="rma-cancel" noValidate className="space-y-4" onSubmit={handleSubmit(onConfirm)}>
        <FormField label={t("rma.cancelReason")} error={errors.reason?.message} required>
          <Textarea rows={3} {...register("reason")} />
        </FormField>
      </form>
    </Modal>
  );
}
