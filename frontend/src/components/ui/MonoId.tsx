import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Serial numbers, claim IDs and RMA numbers always render in mono (Section 3.3). */
export function MonoId({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("font-mono text-sm font-medium", className)} {...props} />;
}
