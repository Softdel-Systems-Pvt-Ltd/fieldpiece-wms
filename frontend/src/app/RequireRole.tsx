import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasRole } from "@/lib/permissions";
import { useSession } from "@/lib/session";
import type { Role } from "@/types";
import { ForbiddenState } from "./ForbiddenState";

// Section 6.2: <RequireRole roles={[...]}/> wraps protected routes.
// UI gate only; the API enforces every permission.

interface RequireRoleProps {
  /** Omit to allow any authenticated user. */
  roles?: readonly Role[];
}

export function RequireRole({ roles }: RequireRoleProps) {
  const { status, user } = useSession();
  const location = useLocation();

  if (status !== "authenticated" || !user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (roles && !hasRole(user.role, roles)) return <ForbiddenState />;
  return <Outlet />;
}
