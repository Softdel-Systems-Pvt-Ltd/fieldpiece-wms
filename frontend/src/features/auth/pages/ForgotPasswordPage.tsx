import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/layout";
import { Card } from "@/components/ui";

/**
 * Passwords live with the identity provider, never in this app (backend ADR-007), so resets happen there.
 * TODO: link to the IdP's reset flow once the provider is chosen. [CONFIRM]
 */
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <AuthLayout>
      <Card as="div">
        <h1 className="mb-2 text-h1">{t("auth.forgotTitle")}</h1>
        <p className="text-body text-text-muted">{t("auth.forgotIdp")}</p>
      </Card>
      <p className="mt-6 text-center">
        <Link to="/login" className="text-info underline underline-offset-2">
          {t("auth.backToSignIn")}
        </Link>
      </p>
    </AuthLayout>
  );
}
