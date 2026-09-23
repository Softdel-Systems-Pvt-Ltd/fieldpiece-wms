import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSession } from "@/lib/session";
import { authApi } from "./api";

export function useLogin() {
  const signIn = useSession((s) => s.signIn);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, accessToken }) => signIn(user, accessToken),
  });
}

export function useLogout() {
  const signOut = useSession((s) => s.signOut);
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => signOut(),
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword });
}

/** On app start, try to restore the session from the refresh cookie. */
export function useBootstrapSession() {
  const status = useSession((s) => s.status);
  const signIn = useSession((s) => s.signIn);
  const markAnonymous = useSession((s) => s.markAnonymous);

  useEffect(() => {
    if (status !== "unknown") return;
    let cancelled = false;
    authApi
      .refresh()
      .then(({ user, accessToken }) => !cancelled && signIn(user, accessToken))
      .catch(() => !cancelled && markAnonymous());
    return () => {
      cancelled = true;
    };
  }, [status, signIn, markAnonymous]);

  return status;
}
