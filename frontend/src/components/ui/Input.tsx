import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Section 5.2: 40px tall, 1px ink-200 border; focus -> ink-1000 border + 1px ring; error -> danger border.
export const inputClasses =
  "block h-10 w-full rounded border border-ink-200 bg-surface px-3 text-body text-text placeholder:text-ink-400 " +
  "focus:border-ink-1000 focus:outline-none focus:ring-1 focus:ring-ink-1000 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger " +
  "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return <input ref={ref} type={type} className={cn(inputClasses, className)} {...props} />;
});
