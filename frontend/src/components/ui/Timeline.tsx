import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Section 5.5: vertical list of icon, actor, action, timestamp, optional comment.
// Internal notes get a yellow left border and an "Internal" label (Section 8.5).

export interface TimelineItem {
  id: string;
  icon: LucideIcon;
  actor: ReactNode;
  action: ReactNode;
  timestamp: ReactNode;
  comment?: ReactNode;
  internal?: boolean;
  internalLabel?: string;
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-6", className)}>
      {items.map(({ id, icon: Icon, actor, action, timestamp, comment, internal, internalLabel }, index) => (
        <li key={id} className="relative flex gap-4">
          {index < items.length - 1 ? (
            <span className="absolute start-4 top-9 h-[calc(100%-12px)] w-px bg-border" aria-hidden />
          ) : null}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-700">
            <Icon size={16} strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-body">
              <span className="font-semibold">{actor}</span> {action}
            </p>
            <p className="text-sm text-text-muted">{timestamp}</p>
            {comment ? (
              <div
                className={cn(
                  "mt-2 rounded bg-surface p-3 text-body shadow-card",
                  internal && "border-s-4 border-brand-500",
                )}
              >
                {internal ? <p className="text-overline mb-1 text-brand-800">{internalLabel}</p> : null}
                {comment}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
