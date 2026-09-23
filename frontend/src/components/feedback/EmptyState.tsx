import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Section 3.5: an icon, a single line of explanation and a primary action. No illustrations.

interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <Icon size={24} strokeWidth={1.75} className="mb-3 text-ink-500" aria-hidden />
      {title ? <h2 className="mb-1 text-h3">{title}</h2> : null}
      <p className="max-w-md text-body text-text-muted">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
