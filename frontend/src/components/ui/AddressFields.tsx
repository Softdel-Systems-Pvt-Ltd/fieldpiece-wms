import type { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "./FormField";
import { Input } from "./Input";

// Address block used by registration (owner) and claims (return address). The form holds it under
// `prefix` (e.g. "address" or "returnAddress"), matching the API's Address shape.

interface AddressFieldsProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  prefix: string;
}

type AddressKey = "line1" | "line2" | "city" | "region" | "postalCode" | "country";

export function AddressFields<T extends FieldValues>({ register, errors, prefix }: AddressFieldsProps<T>) {
  const { t } = useTranslation();
  const group = (errors as Record<string, Partial<Record<AddressKey, { message?: string }>> | undefined>)[
    prefix
  ];
  const field = (key: AddressKey) => `${prefix}.${key}` as Path<T>;
  const error = (key: AddressKey) => group?.[key]?.message;

  return (
    <fieldset className="space-y-4">
      <FormField label={t("fields.address.line1")} error={error("line1")} required>
        <Input autoComplete="address-line1" {...register(field("line1"))} />
      </FormField>
      <FormField label={t("fields.address.line2")} helper={t("common.optional")}>
        <Input autoComplete="address-line2" {...register(field("line2"))} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("fields.address.city")} error={error("city")} required>
          <Input autoComplete="address-level2" {...register(field("city"))} />
        </FormField>
        <FormField label={t("fields.address.region")} error={error("region")} required>
          <Input autoComplete="address-level1" {...register(field("region"))} />
        </FormField>
        <FormField label={t("fields.address.postalCode")} error={error("postalCode")} required>
          <Input autoComplete="postal-code" {...register(field("postalCode"))} />
        </FormField>
        <FormField
          label={t("fields.address.country")}
          error={error("country")}
          helper={t("fields.address.countryHelp")}
          required
        >
          <Input autoComplete="country" maxLength={2} className="uppercase" {...register(field("country"))} />
        </FormField>
      </div>
    </fieldset>
  );
}
