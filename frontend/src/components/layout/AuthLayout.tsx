import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { TopBar } from "./TopBar";

// Public / auth pages: yellow header with the logo, centred content. Mobile-first (Section 11).

export function AuthLayout({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TopBar />
      <header className="flex h-header items-center bg-header px-4 text-header-text md:px-6">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 py-10 md:px-6">
        <div className={wide ? "w-full max-w-2xl" : "w-full max-w-md"}>{children}</div>
      </main>
    </div>
  );
}
