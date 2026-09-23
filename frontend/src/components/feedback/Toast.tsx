import * as RadixToast from "@radix-ui/react-toast";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { useToastStore, type ToastTone } from "./toast-store";

const toneIcon = { success: CheckCircle2, error: AlertTriangle, info: Info } as const;
const toneClass: Record<ToastTone, string> = {
  success: "border-s-success",
  error: "border-s-danger",
  info: "border-s-info",
};

export function Toaster() {
  const { t } = useTranslation();
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <RadixToast.Provider swipeDirection="right">
      {toasts.map(({ id, tone, title, description }) => {
        const Icon = toneIcon[tone];
        return (
          <RadixToast.Root
            key={id}
            // Errors persist: Radix treats Infinity as "never auto-dismiss".
            duration={tone === "error" ? Infinity : 5000}
            type={tone === "error" ? "foreground" : "background"}
            onOpenChange={(open) => !open && dismiss(id)}
            className={cn(
              "flex w-[360px] max-w-[calc(100vw-32px)] items-start gap-3 rounded bg-surface p-4 shadow-overlay",
              "border-s-4",
              toneClass[tone],
            )}
          >
            <Icon
              size={20}
              strokeWidth={1.75}
              aria-hidden
              className={cn(
                "mt-0.5 shrink-0",
                tone === "success" && "text-success",
                tone === "error" && "text-danger",
                tone === "info" && "text-info",
              )}
            />
            <div className="min-w-0 flex-1">
              <RadixToast.Title className="font-semibold">{title}</RadixToast.Title>
              {description ? (
                <RadixToast.Description className="text-sm text-text-muted">
                  {description}
                </RadixToast.Description>
              ) : null}
            </div>
            <RadixToast.Close
              aria-label={t("common.dismiss")}
              className="-me-2 -mt-2 flex h-11 w-11 items-center justify-center rounded hover:bg-ink-50"
            >
              <X size={16} strokeWidth={1.75} aria-hidden />
            </RadixToast.Close>
          </RadixToast.Root>
        );
      })}
      <RadixToast.Viewport className="fixed bottom-4 end-4 z-[100] flex flex-col gap-2 outline-none" />
    </RadixToast.Provider>
  );
}
