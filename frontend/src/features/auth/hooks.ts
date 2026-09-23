import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { isDevIdentity } from "@/lib/env";
import { useSession } from "@/lib/session";
import { authApi } from "./api";

export function useSignIn() {
  const signIn = useSession((s) => s.signIn);
  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: ({ user, accessToken }) => signIn(user, accessToken),
  });
}

export function useLogout() {
  const signOut = useSession((s) => s.signOut);
  return useMutation({
    mutationFn: authApi.signOut,
    onSettled: () => signOut(),
  });
}

export function useDevIdentities() {
  return useQuery({
    queryKey: ["dev-identities"],
    queryFn: authApi.devIdentities,
    enabled: isDevIdentity,
    staleTime: Infinity,
  });
}

/** On app start, try to restore the session from the identity provider. */
export function useBootstrapSession() {
  const status = useSession((s) => s.status);
  const signIn = useSession((s) => s.signIn);
  const markAnonymous = useSession((s) => s.markAnonymous);

  useEffect(() => {
    if (status !== "unknown") return;
    let cancelled = false;
    authApi
      .restore()
      .then(({ user, accessToken }) => !cancelled && signIn(user, accessToken))
      .catch(() => !cancelled && markAnonymous());
    return () => {
      cancelled = true;
    };
  }, [status, signIn, markAnonymous]);

  return status;
}
