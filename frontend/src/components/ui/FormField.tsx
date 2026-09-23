import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { Label } from "./Label";

// Section 5.2: label above, helper below, error with aria-describedby.

interface ControlProps {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
}

interface FormFieldProps {
  label: ReactNode;
  children: ReactElement<ControlProps>;
  helper?: ReactNode;
  error?: string;
  required?: boolean;
  labelAction?: ReactNode;
  className?: string;
}

export function FormField({
  label,
  children,
  helper,
  error,
  required,
  labelAction,
  className,
}: FormFieldProps) {
  const autoId = useId();
  const id = children.props.id ?? autoId;
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
        {labelAction}
      </div>
      {isValidElement(children)
        ? cloneElement(children, {
            id,
            "aria-describedby": describedBy,
            "aria-invalid": error ? true : undefined,
            "aria-required": required || undefined,
          })
        : children}
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {helper ? (
        <p id={helperId} className="mt-1 text-xs text-text-muted">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
