import { forwardRef, type ChangeEvent, type FocusEvent, type InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { normalizeSerial } from "@/lib/format";
import { Input } from "./Input";
import { Popover } from "./Popover";

// Section 5.2: mono font, auto-uppercase, trim on blur, pattern check, "Where do I find this?" popover.
// [CONFIRM] serial formats per product family with Fieldpiece.

type SerialNumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const SerialNumberInput = forwardRef<HTMLInputElement, SerialNumberInputProps>(
  function SerialNumberInput({ className, onChange, onBlur, ...props }, ref) {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      event.target.value = event.target.value.toUpperCase();
      onChange?.(event);
    };
    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
      const normalized = normalizeSerial(event.target.value);
      if (normalized !== event.target.value) {
        event.target.value = normalized;
        onChange?.(event as unknown as ChangeEvent<HTMLInputElement>);
      }
      onBlur?.(event);
    };

    return (
      <Input
        ref={ref}
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className={cn("font-mono uppercase tracking-wide", className)}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  },
);

/** Pass as FormField `labelAction`. */
export function SerialHelpLink() {
  const { t } = useTranslation();
  return (
    <Popover
      trigger={
        <button type="button" className="text-sm text-info underline underline-offset-2 hover:no-underline">
          {t("fields.serialHelp")}
        </button>
      }
    >
      {/* TODO: replace with a label-location photo per product family once Fieldpiece supplies them. */}
      <p>{t("fields.serialHelpBody")}</p>
    </Popover>
  );
}
