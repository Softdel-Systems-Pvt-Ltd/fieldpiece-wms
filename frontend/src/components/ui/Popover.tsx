import * as RadixPopover from "@radix-ui/react-popover";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

export function Popover({ trigger, children, className, align = "start" }: PopoverProps) {
  return (
    <RadixPopover.Root>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          align={align}
          sideOffset={6}
          className={cn(
            "z-50 max-w-xs rounded-lg border border-border bg-surface p-4 text-sm text-text shadow-overlay",
            className,
          )}
        >
          {children}
          <RadixPopover.Arrow className="fill-surface" />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
