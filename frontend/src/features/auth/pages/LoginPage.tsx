import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/components/feedback";
import { AuthLayout } from "@/components/layout";
import { Button, Card, FormField, Input, NativeSelect } from "@/components/ui";
import { applyFieldErrors, toApiError } from "@/lib/api-error";
import { env } from "@/lib/env";
import { useSession } from "@/lib/session";
import type { Role } from "@/types";
import { useLogin } from "../hooks";
import { loginSchema, type LoginForm } from "../schemas";

const ROLES: Role[] = ["technician", "distributor", "claims_agent", "service_center", "admin"];

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useSession((s) => s.status);
  const login = useLogin();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", role: env.enableMocks ? "technician" : undefined },
  });

  if (status === "authenticated") return <Navigate to={from} replace />;

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: () => navigate(from, { replace: true }),
      onError: (error) => {
        if (!applyFieldErrors(error, setError)) toast.error(toApiError(error).message);
      },
    }),
  );

  return (
    <AuthLayout>
      <Card as="div">
        <h1 className="mb-6 text-h1">{t("auth.signInTitle")}</h1>
        {env.enableMocks ? (
          <p className="mb-4 rounded bg-info-bg p-3 text-sm text-info">{t("auth.mockNotice")}</p>
        ) : null}
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField label={t("fields.email")} error={errors.email?.message} required>
            <Input type="email" autoComplete="email" {...register("email")} />
          </FormField>
          <FormField
            label={t("fields.password")}
            error={errors.password?.message}
            required
            labelAction={
              <Link to="/forgot-password" className="text-sm text-info underline underline-offset-2">
                {t("auth.forgotPassword")}
              </Link>
            }
          >
            <Input type="password" autoComplete="current-password" {...register("password")} />
          </FormField>
          {env.enableMocks ? (
            <FormField label={t("auth.mockRole")}>
              <NativeSelect {...register("role")}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}`)}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          ) : null}
          <Button type="submit" size="lg" icon={LogIn} loading={login.isPending} className="w-full">
            {t("auth.signIn")}
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-center text-body">
        <Link to="/check" className="text-info underline underline-offset-2">
          {t("auth.checkWarrantyLink")}
        </Link>
      </p>
    </AuthLayout>
  );
}
