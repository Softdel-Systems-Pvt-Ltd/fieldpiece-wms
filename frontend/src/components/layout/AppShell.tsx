import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AppHeader } from "./AppHeader";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

// Section 6.1 app shell: top bar, yellow header, sidebar, content (max-w-content, 24px gutter).

interface AppShellProps {
  children: ReactNode;
  onSignOut: () => void;
}

export function AppShell({ children, onSignOut }: AppShellProps) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-ink-0 focus:px-4 focus:py-2"
      >
        {t("app.skipToContent")}
      </a>
      <TopBar />
      <AppHeader onSignOut={onSignOut} />
      <div className="flex flex-1">
        <Sidebar />
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          <div className="mx-auto max-w-content px-4 py-6 md:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
