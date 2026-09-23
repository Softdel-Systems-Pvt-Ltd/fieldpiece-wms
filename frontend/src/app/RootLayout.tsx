import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Spinner } from "@/components/ui";
import { useBootstrapSession } from "@/features/auth";

/** Restores the session once, then renders the matched route (public or protected). */
export function RootLayout() {
  const status = useBootstrapSession();

  if (status === "unknown") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner size={24} label="Loading" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <Spinner size={24} label="Loading" />
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
}
