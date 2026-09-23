import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowLeft, ArrowRight, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  Textarea,
  type UploadItem,
  WarrantyStatusBadge,
} from "@/components/ui";
import { applyFieldErrors, toApiError } from "@/lib/api-error";
import { formatDate, normalizeSerial, toIsoDate } from "@/lib/format";
import { emptyAddress, withoutBlank } from "@/lib/schemas";
import { uploadAttachment } from "@/lib/uploads";
import type { Registration } from "@/types";
import { claimsApi } from "../api";
import { useFailureCategories } from "../hooks";
import { draftReadySchema, makeClaimSchema, type ClaimForm, type ClaimValues } from "../schemas";

// Section 8.4: 4 steps. Drafts auto-save every 10 s to the API as DRAFT once the API would accept them
// (it needs a registered unit, a category, a date and 30+ characters), with a local copy as fallback.

const DRAFT_KEY = "fp-wms-claim-draft";
const AUTOSAVE_MS = 10_000;

const STEP_FIELDS: FieldPath<ClaimForm>[][] = [
  ["serialNumber"],
  ["failureCategory", "failureDate", "description", "photoCount"],
  ["returnAddress", "preferredResolution"],
  [],
];

interface SavedDraft {
  id: string;
  version: number;
}

function readLocalDraft(): Partial<ClaimForm> | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<ClaimForm>) : null;
  } catch {
    return null;
  }
}

function writeLocalDraft(values: ClaimForm | null) {
  try {
    if (values) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    else window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // storage blocked; the API draft still exists
  }
}

export default function NewClaimPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categories = useFailureCategories();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [unit, setUnit] = useState<Registration | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const draft = useRef<SavedDraft | null>(null);
  const lastSaved = useRef("");

  const photoRequired = useMemo(
    () => new Set((categories.data ?? []).filter((c) => c.requiresPhoto).map((c) => c.code)),
    [categories.data],
  );
  const schema = useMemo(() => makeClaimSchema(photoRequired), [photoRequired]);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    getValues,
    formState: { errors },
  } = useForm<ClaimForm, unknown, ClaimValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      serialNumber: searchParams.get("serial") ?? "",
      failureCategory: "",
      failureDate: "",
      description: "",
      photoCount: 0,
      returnAddress: emptyAddress,
      ...readLocalDraft(),
    },
  });

  useEffect(
    () => setValue("photoCount", files.length, { shouldValidate: step === 1 }),
    [files, setValue, step],
  );

  /** Autosave: local copy always; API draft once it would be accepted. */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const values = getValues();
      const snapshot = JSON.stringify(values);
      if (snapshot === lastSaved.current) return;
      lastSaved.current = snapshot;
      writeLocalDraft(values);
      if (unit && draftReadySchema.safeParse(values).success) void saveDraft(values).catch(() => undefined);
    }, AUTOSAVE_MS);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- saveDraft reads refs; re-arming on each render is wasteful
  }, [getValues, unit]);

  const draftBody = (values: ClaimForm, attachmentIds: string[] = []) => ({
    failureCategory: values.failureCategory,
    failureDate: values.failureDate,
    description: values.description.trim(),
    preferredResolution: values.preferredResolution ?? null,
    returnAddress: values.returnAddress.line1
      ? { ...withoutBlank(values.returnAddress), country: values.returnAddress.country.toUpperCase() }
      : null,
    attachmentIds,
  });

  const saveDraft = async (values: ClaimForm, attachmentIds: string[] = []): Promise<SavedDraft> => {
    const body = draftBody(values, attachmentIds);
    const saved = draft.current
      ? await claimsApi.updateDraft(draft.current.id, draft.current.version, body)
      : await claimsApi.createDraft({ ...body, registrationId: unit?.id });
    draft.current = { id: saved.id, version: saved.version };
    return draft.current;
  };

  /** Step 1: the unit must be registered to the caller; warn (don't block) when out of warranty. [CONFIRM] */
  const lookUpUnit = async (): Promise<boolean> => {
    if (!(await trigger("serialNumber", { shouldFocus: true }))) return false;
    setLookingUp(true);
    try {
      const found = await claimsApi.findRegistration(normalizeSerial(getValues("serialNumber")));
      setUnit(found);
      if (!found) {
        setError(
          "serialNumber",
          { type: "server", message: t("claims.unitNotFound") },
          { shouldFocus: true },
        );
        return false;
      }
      return true;
    } catch (error) {
      toast.error(toApiError(error).message);
      return false;
    } finally {
      setLookingUp(false);
    }
  };

  const next = async () => {
    const ok = step === 0 ? await lookUpUnit() : await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (ok) setStep((s) => Math.min(s + 1, 3));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const ids: string[] = [];
    for (const [index, item] of files.entries()) {
      const setProgress = (progress: number) =>
        setFiles((current) =>
          current.map((f, i) => (i === index ? { ...f, progress, error: undefined } : f)),
        );
      try {
        ids.push((await uploadAttachment(item.file, "claim", setProgress)).id);
      } catch (error) {
        setFiles((current) =>
          current.map((f, i) => (i === index ? { ...f, error: toApiError(error).message } : f)),
        );
        throw error;
      }
    }
    return ids;
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const attachmentIds = await uploadPhotos();
      const saved = await saveDraft(values, attachmentIds);
      const submitted = await claimsApi.transition(saved.id, "submit", saved.version);
      writeLocalDraft(null);
      toast.success(t("claims.submitted", { id: submitted.displayNo }), t("claims.submittedNext"));
      navigate(`/claims/${submitted.id}`, { replace: true });
    } catch (error) {
      if (!applyFieldErrors(error, setError, { attachmentIds: "photoCount" }))
        toast.error(toApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  });

  const category = watch("failureCategory");
  const steps = [
    t("claims.stepUnit"),
    t("claims.stepFailure"),
    t("claims.stepReturn"),
    t("claims.stepReview"),
  ];
  const values = getValues();

  return (
    <>
      <PageHeader
        title={t("claims.new")}
        breadcrumbs={[{ label: t("nav.claims"), to: "/claims" }, { label: t("claims.new") }]}
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
                <SerialNumberInput {...register("serialNumber", { onChange: () => setUnit(null) })} />
              </FormField>
              {errors.serialNumber?.type === "server" ? (
                <p className="text-sm">
                  <Link
                    to={`/registrations/new?serial=${encodeURIComponent(values.serialNumber)}`}
                    className="font-semibold text-info underline"
                  >
                    {t("check.registerProduct")}
                  </Link>
                </p>
              ) : null}
            </>
          ) : null}

          {unit && step > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-ink-50 p-3 text-sm">
              <span>
                {unit.productName} · <MonoId>{unit.serialNumber}</MonoId>
              </span>
              <span className="flex items-center gap-2">
                <WarrantyStatusBadge status={unit.status} />
                {t("claims.coveredUntil", { date: formatDate(unit.warrantyEnd, i18n.language) })}
              </span>
              {unit.status === "EXPIRED" ? (
                <p className="flex w-full items-center gap-2 font-semibold text-warning">
                  <AlertTriangle size={16} aria-hidden /> {t("claims.outOfWarrantyWarning")}
                </p>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <>
              <FormField
                label={t("claims.columns.category")}
                error={errors.failureCategory?.message}
                required
              >
                <NativeSelect disabled={categories.isLoading} {...register("failureCategory")}>
                  <option value="">—</option>
                  {categories.data?.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label={t("claims.failureDate")} error={errors.failureDate?.message} required>
                <Input
                  type="date"
                  min={unit?.purchaseDate}
                  max={toIsoDate(new Date())}
                  {...register("failureDate")}
                />
              </FormField>
              <FormField
                label={t("claims.description")}
                error={errors.description?.message}
                helper={t("claims.descriptionHelp")}
                required
              >
                <Textarea rows={5} {...register("description")} />
              </FormField>
              <FormField
                label={t("claims.photos")}
                error={errors.photoCount?.message}
                required={photoRequired.has(category)}
              >
                <FileDropzone
                  value={files}
                  onChange={setFiles}
                  onReject={(m) => m.forEach((msg) => toast.error(msg))}
                />
              </FormField>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h2 className="text-h3">{t("claims.returnAddress")}</h2>
              <AddressFields register={register} errors={errors} prefix="returnAddress" />
              <FormField
                label={t("claims.preferredResolution")}
                error={errors.preferredResolution?.message}
                required
              >
                <NativeSelect defaultValue="" {...register("preferredResolution")}>
                  <option value="" disabled>
                    —
                  </option>
                  {(["repair", "replace", "credit"] as const).map((r) => (
                    <option key={r} value={r}>
                      {t(`claims.resolutions.${r}`)}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
            </>
          ) : null}

          {step === 3 ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-overline text-text-muted">{t("claims.columns.category")}</dt>
                <dd>{categories.data?.find((c) => c.code === category)?.label ?? category}</dd>
              </div>
              <div>
                <dt className="text-overline text-text-muted">{t("claims.failureDate")}</dt>
                <dd>{formatDate(values.failureDate, i18n.language)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-overline text-text-muted">{t("claims.description")}</dt>
                <dd className="whitespace-pre-line">{values.description}</dd>
              </div>
              <div>
                <dt className="text-overline text-text-muted">{t("claims.photos")}</dt>
                <dd>{files.length}</dd>
              </div>
              <div>
                <dt className="text-overline text-text-muted">{t("claims.preferredResolution")}</dt>
                <dd>
                  {values.preferredResolution ? t(`claims.resolutions.${values.preferredResolution}`) : "—"}
                </dd>
              </div>
            </dl>
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
            {step < 3 ? (
              <Button icon={ArrowRight} loading={lookingUp} onClick={() => void next()}>
                {t("common.next")}
              </Button>
            ) : (
              <Button type="submit" icon={Send} loading={submitting}>
                {t("claims.actions.submit")}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </>
  );
}
