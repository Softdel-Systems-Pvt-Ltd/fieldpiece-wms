import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ScrollText } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState, Skeleton, toast } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import { Badge, Button, Card, FormField, Input, Modal } from "@/components/ui";
import { applyFieldErrors, toApiError } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { AdminTabs } from "../components/AdminTabs";
import { useCreatePolicy, useWarrantyPolicies } from "../hooks";
import { policySchema, splitList, type PolicyFormInput, type PolicyFormValues } from "../schemas";

// Warranty terms come from policies, never hard-coded (Section 7.2). Once registrations use a policy its
// terms are frozen: end it and create a new one. [CONFIRM real terms per product line]

function CreatePolicyModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const create = useCreatePolicy();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PolicyFormInput, unknown, PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      baseMonths: 12,
      registrationBonusMonths: 0,
      registrationWindowDays: "",
      coverage: "manufacturing_defects",
      exclusions: "physical_damage, misuse, consumables",
    },
  });

  const onSubmit = handleSubmit((v) =>
    create.mutate(
      {
        sku: v.sku || null,
        baseMonths: v.baseMonths,
        registrationBonusMonths: v.registrationBonusMonths,
        registrationWindowDays: v.registrationWindowDays === "" ? null : v.registrationWindowDays,
        coverage: splitList(v.coverage),
        exclusions: splitList(v.exclusions),
        effectiveFrom: v.effectiveFrom,
        effectiveTo: v.effectiveTo || null,
      },
      {
        onSuccess: () => {
          toast.success(t("admin.policyCreated"));
          onClose();
        },
        onError: (error) => {
          if (!applyFieldErrors(error, setError)) toast.error(toApiError(error).message);
        },
      },
    ),
  );

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("admin.newPolicy")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="create-policy" loading={create.isPending}>
            {t("admin.createPolicy")}
          </Button>
        </>
      }
    >
      <form id="create-policy" noValidate onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="SKU"
          helper={t("admin.skuHelp")}
          error={errors.sku?.message}
          className="sm:col-span-2"
        >
          <Input placeholder="SC680" {...register("sku")} />
        </FormField>
        <FormField label={t("admin.baseMonths")} error={errors.baseMonths?.message} required>
          <Input type="number" min={0} {...register("baseMonths")} />
        </FormField>
        <FormField label={t("admin.bonusMonths")} error={errors.registrationBonusMonths?.message}>
          <Input type="number" min={0} {...register("registrationBonusMonths")} />
        </FormField>
        <FormField
          label={t("admin.windowDays")}
          helper={t("admin.windowHelp")}
          error={errors.registrationWindowDays?.message}
        >
          <Input type="number" min={0} {...register("registrationWindowDays")} />
        </FormField>
        <span />
        <FormField label={t("admin.effectiveFrom")} error={errors.effectiveFrom?.message} required>
          <Input type="date" {...register("effectiveFrom")} />
        </FormField>
        <FormField
          label={t("admin.effectiveTo")}
          error={errors.effectiveTo?.message}
          helper={t("common.optional")}
        >
          <Input type="date" {...register("effectiveTo")} />
        </FormField>
        <FormField label={t("admin.coverage")} helper={t("admin.listHelp")} className="sm:col-span-2">
          <Input {...register("coverage")} />
        </FormField>
        <FormField label={t("admin.exclusions")} helper={t("admin.listHelp")} className="sm:col-span-2">
          <Input {...register("exclusions")} />
        </FormField>
      </form>
    </Modal>
  );
}

export default function AdminPoliciesPage() {
  const { t, i18n } = useTranslation();
  const policies = useWarrantyPolicies();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title={t("admin.policies")}
        breadcrumbs={[{ label: t("nav.admin") }, { label: t("admin.policies") }]}
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            {t("admin.newPolicy")}
          </Button>
        }
      />
      <AdminTabs />
      <Card>
        {policies.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : policies.error ? (
          <ErrorState error={policies.error} onRetry={() => void policies.refetch()} />
        ) : !policies.data?.length ? (
          <EmptyState icon={ScrollText} message={t("admin.noPolicies")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("admin.policies")}</caption>
              <thead className="bg-ink-50">
                <tr className="text-overline text-ink-600">
                  {[
                    "SKU",
                    t("admin.baseMonths"),
                    t("admin.bonusMonths"),
                    t("admin.effectiveFrom"),
                    t("admin.effectiveTo"),
                    t("admin.exclusions"),
                    "",
                  ].map((h, i) => (
                    <th key={i} scope="col" className="h-10 px-3 text-start">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policies.data.map((p) => (
                  <tr key={p.id} className="h-12 border-t border-ink-100">
                    <td className="px-3 font-mono">{p.sku ?? t("admin.defaultPolicy")}</td>
                    <td className="px-3">{p.baseMonths}</td>
                    <td className="px-3">
                      {p.registrationBonusMonths}
                      {p.registrationWindowDays !== null
                        ? ` (${t("admin.withinDays", { count: p.registrationWindowDays })})`
                        : ""}
                    </td>
                    <td className="px-3">{formatDate(p.effectiveFrom, i18n.language)}</td>
                    <td className="px-3">{p.effectiveTo ? formatDate(p.effectiveTo, i18n.language) : "—"}</td>
                    <td className="px-3">{p.exclusions.join(", ")}</td>
                    <td className="px-3">
                      {p.inUse ? <Badge className="bg-ink-100 text-ink-700">{t("admin.inUse")}</Badge> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {creating ? <CreatePolicyModal onClose={() => setCreating(false)} /> : null}
    </>
  );
}
