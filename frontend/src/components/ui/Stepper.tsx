import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

// Section 5.5: done steps black, current yellow, upcoming grey.

interface StepperProps {
  steps: string[];
  current: number; // zero-based
  className?: string;
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol className={cn("flex items-center gap-2", className)}>
      {steps.map((label, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li
            key={label}
            className="flex flex-1 items-center gap-2"
            aria-current={state === "current" ? "step" : undefined}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                state === "done" && "bg-ink-1000 text-ink-0",
                state === "current" && "bg-brand-500 text-ink-1000",
                state === "upcoming" && "bg-ink-100 text-ink-500",
              )}
            >
              {state === "done" ? <Check size={16} strokeWidth={2} aria-hidden /> : index + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm sm:inline",
                state === "upcoming" ? "text-text-muted" : "font-semibold text-text",
              )}
            >
              {label}
            </span>
            {index < steps.length - 1 ? (
              <span
                className={cn("h-px flex-1", index < current ? "bg-ink-1000" : "bg-ink-200")}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
