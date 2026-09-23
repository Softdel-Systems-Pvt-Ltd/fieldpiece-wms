import * as Dialog from "@radix-ui/react-dialog";
import { ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { useCurrentRole } from "@/lib/session";
import { useUiPrefs } from "@/lib/ui-prefs";
import { Logo } from "./Logo";
import { navItemsFor } from "./nav-items";

// Section 6.1: white, 240px, collapses to 64px. Active item: 4px brand-500 bar on the left,
// bold text, ink-50 background. On mobile it becomes a drawer.

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const role = useCurrentRole();

  return (
    <ul className="space-y-1 py-4">
      {navItemsFor(role).map(({ to, labelKey, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            title={collapsed ? t(labelKey) : undefined}
            className={({ isActive }) =>
              cn(
                "flex h-11 items-center gap-3 border-s-4 pe-4 ps-5 text-body text-text hover:bg-ink-50 dark:hover:bg-ink-700",
                isActive ? "border-brand-500 bg-ink-50 font-bold dark:bg-ink-700" : "border-transparent",
                collapsed && "justify-center pe-0 ps-0",
              )
            }
          >
            <Icon size={20} strokeWidth={1.75} aria-hidden className="shrink-0" />
            <span className={cn(collapsed && "sr-only")}>{t(labelKey)}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function Sidebar() {
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen } = useUiPrefs();

  return (
    <>
      {/* Desktop */}
      <nav
        aria-label={t("nav.main")}
        className={cn(
          "no-print hidden shrink-0 flex-col border-e border-border bg-surface transition-[width] lg:flex",
          sidebarCollapsed ? "w-sidebar-collapsed" : "w-sidebar",
        )}
      >
        <div className="flex-1 overflow-y-auto">
          <NavList collapsed={sidebarCollapsed} />
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-11 items-center justify-center border-t border-border text-ink-500 hover:bg-ink-50 dark:hover:bg-ink-700"
          aria-label={sidebarCollapsed ? t("nav.expand") : t("nav.collapse")}
          aria-expanded={!sidebarCollapsed}
        >
          {sidebarCollapsed ? (
            <ChevronsRight size={20} strokeWidth={1.75} aria-hidden />
          ) : (
            <ChevronsLeft size={20} strokeWidth={1.75} aria-hidden />
          )}
        </button>
      </nav>

      {/* Mobile drawer */}
      <Dialog.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 start-0 z-50 w-72 max-w-[85vw] bg-surface shadow-overlay lg:hidden">
            <div className="flex h-header items-center justify-between bg-header px-4 text-header-text">
              <Dialog.Title asChild>
                <div>
                  <Logo compact />
                </div>
              </Dialog.Title>
              <Dialog.Description className="sr-only">{t("nav.main")}</Dialog.Description>
              <Dialog.Close
                className="flex h-11 w-11 items-center justify-center rounded hover:bg-tint"
                aria-label={t("header.closeMenu")}
              >
                <X size={20} strokeWidth={1.75} aria-hidden />
              </Dialog.Close>
            </div>
            <nav aria-label={t("nav.main")}>
              <NavList collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
            </nav>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
