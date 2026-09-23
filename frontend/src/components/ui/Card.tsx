import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

// Section 5.5: white surface, rounded-lg, shadow-card, 24px padding, optional header row.

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  actions?: ReactNode;
  as?: "section" | "article" | "div";
}

export function Card({ title, actions, as: Tag = "section", className, children, ...props }: CardProps) {
  return (
    <Tag className={cn("rounded-lg bg-surface p-6 shadow-card", className)} {...props}>
      {title || actions ? (
        <header className="mb-4 flex items-center justify-between gap-4">
          {title ? <h3 className="text-h3">{title}</h3> : <span />}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </Tag>
  );
}
