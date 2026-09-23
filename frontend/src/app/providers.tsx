import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "@/components/feedback";
import { TooltipProvider } from "@/components/ui";
import { i18n } from "@/lib/i18n";
import { queryClient } from "@/lib/query-client";
import { useUiPrefs } from "@/lib/ui-prefs";

// QueryClient, Theme, Toast (Section 2.3).

function ThemeSync() {
  const theme = useUiPrefs((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <TooltipProvider delayDuration={300}>
          <ThemeSync />
          {children}
          <Toaster />
        </TooltipProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
