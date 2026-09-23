import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Section 5.3: pill-less badge (2px radius), 12px uppercase semibold, tinted background, leading dot.

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  dot?: boolean;
}

export function Badge({ className, dot = true, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "text-overline inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-0.5",
        className,
      )}
      {...props}
    >
      {dot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}
