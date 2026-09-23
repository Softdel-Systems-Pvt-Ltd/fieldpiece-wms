import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label className={cn("block text-sm font-semibold text-text", className)} {...props}>
      {children}
      {required ? (
        <span className="ms-0.5 text-danger" aria-hidden>
          *
        </span>
      ) : null}
    </label>
  );
}
