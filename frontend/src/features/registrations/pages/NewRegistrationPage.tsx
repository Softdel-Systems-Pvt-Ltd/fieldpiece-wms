import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Download, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import {
  AddressFields,
  Button,
  Card,
  FileDropzone,
  FormField,
  Input,
  MonoId,
  NativeSelect,
  SerialHelpLink,
  SerialNumberInput,
  Stepper,
  type UploadItem,
} from "@/components/ui";
import { applyFieldErrors, toApiError } from "@/lib/api-error";
import { env } from "@/lib/env";
import { formatDate, toIsoDate } from "@/lib/format";
import { emptyAddress, withoutBlank } from "@/lib/schemas";
import { useCurrentUser } from "@/lib/session";
import { uploadAttachment } from "@/lib/uploads";
import type { Registration } from "@/types";
import { registrationsApi } from "../api";
import { WarrantyPreview } from "../components/WarrantyPreview";
import { useCreateRegistration, useProductCatalogue } from "../hooks";
import {
  detectSku,
  REGISTRATION_FIELD_MAP,
  registrationSchema,
  type RegistrationForm,
  type RegistrationValues,
} from "../schemas";

// Section 8.3: Product -> Purchase -> Owner and review.
// TODO: searchable SKU picker with product images; pick an existing customer (distributors).

const STEP_FIELDS: FieldPath<RegistrationForm>[][] = [
  ["serialNumber", "sku"],
  ["purchaseDate", "proofCount"],
  ["ownerName", "companyName", "ownerEmail", "ownerPhone", "address", "acceptTerms"],
];

interface Duplicate {
  ownedByYou: boolean;
  registrationId?: string;
}

export default function NewRegistrationPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const user = useCurrentUser();
  const products = useProductCatalogue();
  const create = useCreateRegistration();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [duplicate, setDuplicate] = useState<Duplicate | null>(null);
  const [created, setCreated] = useState<Registration | null>(null);
  const isTechnician = user?.role === "technician";

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<RegistrationForm, unknown, RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      serialNumber: searchParams.get("serial") ?? "",
      sku: "",
      purchaseDate: "",
      proofCount: 0,
      requireProof: env.requireProofOfPurchase,
      // Pre-filled for a logged-in technician (Section 8.3).
      ownerName: isTechnician ? user.name : "",
      ownerEmail: isTechnician ? user.email : "",
      address: emptyAddress,
    },
  });

  const serial = watch("serialNumber");
  const sku = watch("sku");
  const purchaseDate = watch("purchaseDate");
  const product = products.data?.find((p) => p.sku === sku);

  useEffect(() => setValue("proofCount", files.length), [files, setValue]);
  useEffect(() => setValue("launchDate", product?.launchDate ?? undefined), [product, setValue]);
  useEffect(() => {
    setDuplicate(null);
    if (!products.data || sku) return;
    const detected = detectSku(serial, products.data);
    if (detected) setValue("sku", detected, { shouldValidate: true });
  }, [serial, sku, products.data, setValue]);

  const next = async () => {
    if (await trigger(STEP_FIELDS[step], { shouldFocus: true })) setStep((s) => s + 1);
  };

  /** Uploads each file straight to storage, showing progress, and returns the clean attachment IDs. */
  const uploadProofs = async (): Promise<string[]> => {
    const ids: string[] = [];
    for (const [index, item] of files.entries()) {
      const setProgress = (progress: number) =>
        setFiles((current) =>
          current.map((f, i) => (i === index ? { ...f, progress, error: undefined } : f)),
        );
      try {
        ids.push((await uploadAttachment(item.file, "registration", setProgress)).id);
      } catch (error) {
        const message = toApiError(error).message;
        setFiles((current) => current.map((f, i) => (i === index ? { ...f, error: message } : f)));
        throw error;
      }
    }
    return ids;
  };

  const onSubmit = handleSubmit(async (values) => {
    setUploading(true);
    let proofOfPurchaseIds: string[];
    try {
      proofOfPurchaseIds = await uploadProofs();
    } catch (error) {
      toast.error(toApiError(error).message);
      return;
    } finally {
      setUploading(false);
    }

    create.mutate(
      {
        serialNumber: values.serialNumber,
        sku: values.sku,
        purchaseDate: values.purchaseDate,
        proofOfPurchaseIds,
        customer: {
          contactName: values.ownerName,
          ...withoutBlank({
            companyName: values.companyName,
            email: values.ownerEmail,
            phone: values.ownerPhone,
          }),
          address: withoutBlank(values.address),
        },
      },
      {
        onSuccess: setCreated,
        onError: (error) => {
          const apiError = toApiError(error);
          if (apiError.code === "REGISTRATION_DUPLICATE_SERIAL") {
            setDuplicate(apiError.details as unknown as Duplicate);
            setStep(0);
            setError(
              "serialNumber",
              { type: "server", message: t("registrations.duplicate") },
              { shouldFocus: true },
            );
            return;
          }
          if (!applyFieldErrors(error, setError, REGISTRATION_FIELD_MAP)) toast.error(apiError.message);
          const firstBadStep = STEP_FIELDS.findIndex((fields) =>
            fields.some((f) =>
              Object.keys(apiError.fieldErrors).some((k) => k.startsWith(String(f)) || k === "sku"),
            ),
          );
          if (firstBadStep >= 0) setStep(firstBadStep);
        },
      },
    );
  });

  const downloadCertificate = async (id: string) => {
    try {
      window.open(await registrationsApi.certificateUrl(id), "_blank", "noopener");
    } catch (error) {
      const apiError = toApiError(error);
      toast.info(
        apiError.code === "CERTIFICATE_NOT_READY" ? t("registrations.certificatePending") : apiError.message,
      );
    }
  };

  if (created) {
    return (
      <Card className="mx-auto max-w-xl text-center">
        <CheckCircle2 size={24} strokeWidth={1.75} className="mx-auto mb-3 text-success" aria-hidden />
        <h1 className="text-h1">{t("registrations.registered")}</h1>
        <p className="mt-2 text-body">
          {created.productName} · <MonoId>{created.serialNumber}</MonoId>
        </p>
        <p className="mt-1 text-body text-text-muted">
          {t("check.coverageUntil", { date: formatDate(created.warrantyEnd, i18n.language) })}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="secondary" icon={Download} onClick={() => void downloadCertificate(created.id)}>
            {t("registrations.downloadCertificate")}
          </Button>
          <Button
            icon={ShieldCheck}
            onClick={() => {
              setCreated(null);
              setFiles([]);
              setStep(0);
              reset();
            }}
          >
            {t("registrations.registerAnother")}
          </Button>
        </div>
      </Card>
    );
  }

  const steps = [
    t("registrations.stepProduct"),
    t("registrations.stepPurchase"),
    t("registrations.stepReview"),
  ];

  return (
    <>
      <PageHeader
        title={t("registrations.new")}
        breadcrumbs={[
          { label: t("registrations.title"), to: "/registrations" },
          { label: t("registrations.new") },
        ]}
      />
      <Card className="mx-auto max-w-3xl">
        <Stepper steps={steps} current={step} className="mb-8" />
        <form noValidate onSubmit={onSubmit} className="space-y-4">
          {step === 0 ? (
            <>
              <FormField
                label={t("fields.serialNumber")}
                error={errors.serialNumber?.message}
                required
                labelAction={<SerialHelpLink />}
              >
                <SerialNumberInput {...register("serialNumber")} />
              </FormField>
              {duplicate ? (
                <p role="alert" className="rounded border-s-4 border-danger bg-danger-bg p-3 text-sm">
                  {t("registrations.duplicate")}{" "}
                  {duplicate.ownedByYou && duplicate.registrationId ? (
                    <Link
                      to={`/registrations?serial=${encodeURIComponent(serial)}`}
                      className="font-semibold underline"
                    >
                      {t("registrations.viewExisting")}
                    </Link>
                  ) : (
                    <a
                      href="https://www.fieldpiece.com/support/"
                      className="font-semibold underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("registrations.contactSupport")}
                    </a>
                  )}
                </p>
              ) : null}
              <FormField label={t("registrations.pickSku")} error={errors.sku?.message} required>
                <NativeSelect {...register("sku")} disabled={products.isLoading}>
                  <option value="">—</option>
                  {products.data?.map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.sku} · {p.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <FormField label={t("fields.purchaseDate")} error={errors.purchaseDate?.message} required>
                <Input
                  type="date"
                  max={toIsoDate(new Date())}
                  min={product?.launchDate ?? undefined}
                  {...register("purchaseDate")}
                />
              </FormField>
              <FormField
                label={t("registrations.proofOfPurchase")}
                error={errors.proofCount?.message}
                required={env.requireProofOfPurchase}
              >
                <FileDropzone
                  value={files}
                  onChange={setFiles}
                  maxFiles={3}
                  onReject={(m) => m.forEach((msg) => toast.error(msg))}
                />
              </FormField>
              <WarrantyPreview product={product} purchaseDate={purchaseDate} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t("registrations.ownerName")} error={errors.ownerName?.message} required>
                  <Input autoComplete="name" {...register("ownerName")} />
                </FormField>
                <FormField label={t("registrations.companyName")} helper={t("common.optional")}>
                  <Input autoComplete="organization" {...register("companyName")} />
                </FormField>
                <FormField
                  label={t("fields.email")}
                  error={errors.ownerEmail?.message}
                  helper={t("registrations.emailHelp")}
                >
                  <Input type="email" autoComplete="email" {...register("ownerEmail")} />
                </FormField>
                <FormField label={t("registrations.phone")} helper={t("common.optional")}>
                  <Input type="tel" autoComplete="tel" {...register("ownerPhone")} />
                </FormField>
              </div>
              <AddressFields register={register} errors={errors} prefix="address" />
              <WarrantyPreview product={product} purchaseDate={purchaseDate} />
              <div>
                <label className="inline-flex min-h-11 items-center gap-2 text-body">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded-sm border-ink-400 text-ink-1000 focus:ring-ink-1000"
                    aria-invalid={errors.acceptTerms ? true : undefined}
                    {...register("acceptTerms")}
                  />
                  {t("registrations.acceptTerms")}
                </label>
                {errors.acceptTerms ? (
                  <p className="text-sm text-danger">{errors.acceptTerms.message}</p>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="flex justify-between gap-2 border-t border-border pt-6">
            <Button
              variant="secondary"
              icon={ArrowLeft}
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              {t("common.back")}
            </Button>
            {step < 2 ? (
              <Button icon={ArrowRight} onClick={() => void next()}>
                {t("common.next")}
              </Button>
            ) : (
              <Button type="submit" icon={ShieldCheck} loading={uploading || create.isPending}>
                {t("registrations.new")}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </>
  );
}
