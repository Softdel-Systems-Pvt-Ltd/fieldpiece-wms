import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/components/feedback";
import { AuthLayout } from "@/components/layout";
import { Button, Card, FormField, NativeSelect } from "@/components/ui";
import { toApiError } from "@/lib/api-error";
import { isDevIdentity } from "@/lib/env";
import { useSession } from "@/lib/session";
import type { Role } from "@/types";
import { useDevIdentities, useSignIn } from "../hooks";
import { devSignInSchema, type DevSignInForm } from "../schemas";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useSession((s) => s.status);
  const signIn = useSignIn();
  const identities = useDevIdentities();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DevSignInForm>({ resolver: zodResolver(devSignInSchema), defaultValues: { email: "" } });

  if (status === "authenticated") return <Navigate to={from} replace />;

  const onSubmit = handleSubmit(({ email }) =>
    signIn.mutate(email, {
      onSuccess: () => navigate(from, { replace: true }),
      onError: (error) => toast.error(toApiError(error).message),
    }),
  );

  return (
    <AuthLayout>
      <Card as="div">
        <h1 className="mb-6 text-h1">{t("auth.signInTitle")}</h1>
        {isDevIdentity ? (
          <>
            <p className="mb-4 rounded bg-info-bg p-3 text-sm text-info">{t("auth.devNotice")}</p>
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <FormField label={t("auth.signInAs")} error={errors.email?.message} required>
                <NativeSelect disabled={identities.isLoading} {...register("email")}>
                  <option value="">{identities.isLoading ? t("common.loading") : "—"}</option>
                  {identities.data?.map((identity) => (
                    <option key={identity.email} value={identity.email}>
                      {identity.displayName} · {identity.roles.map((r) => t(`roles.${r as Role}`)).join(", ")}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              {identities.isError ? <p className="text-sm text-danger">{t("auth.idpUnavailable")}</p> : null}
              <Button type="submit" size="lg" icon={LogIn} loading={signIn.isPending} className="w-full">
                {t("auth.signIn")}
              </Button>
            </form>
          </>
        ) : (
          // TODO: OIDC Authorization Code + PKCE redirect via oidc-client-ts once the IdP is chosen. [CONFIRM]
          <p className="text-body text-text-muted">{t("auth.oidcPending")}</p>
        )}
      </Card>
      <p className="mt-6 text-center text-body">
        <Link to="/check" className="text-info underline underline-offset-2">
          {t("auth.checkWarrantyLink")}
        </Link>
      </p>
    </AuthLayout>
  );
}
