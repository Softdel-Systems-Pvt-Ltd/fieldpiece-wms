import { Suspense } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/feedback";
import { AppShell } from "@/components/layout";
import { useLogout } from "@/features/auth";

/** Authenticated shell: top bar, header, sidebar, content. */
export function AppLayout() {
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <AppShell
      onSignOut={() => logout.mutate(undefined, { onSettled: () => navigate("/login", { replace: true }) })}
    >
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
