import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { toast } from "@/components/feedback";
import { useCurrentRole } from "@/lib/session";
import type { Claim } from "@/types";
import { useClaimTransition } from "../hooks";
import { allowedTransitions, type ClaimAction } from "../transitions";
import { ApproveClaimModal } from "./ApproveClaimModal";
import { RejectClaimModal } from "./RejectClaimModal";

// Renders only the actions transitions.ts allows for this status + role (Section 7.1).

export function ClaimActions({ claim }: { claim: Claim }) {
  const { t } = useTranslation();
  const role = useCurrentRole();
  const transition = useClaimTransition(claim.id);
  const [modal, setModal] = useState<ClaimAction | null>(null);
  const actions = allowedTransitions(claim.status, role);

  if (!actions.length) return null;

  const run = (action: ClaimAction, extra: Record<string, string | undefined> = {}) =>
    transition.mutate(
      { action, ...extra },
      {
        onSuccess: () => {
          setModal(null);
          toast.success(t(`claims.actions.${action}`));
        },
      },
    );

  return (
    <>
      {/* Secondary actions first so the primary one sits on the right. */}
      {[...actions]
        .sort((a, b) => (a.tone === "primary" ? 1 : 0) - (b.tone === "primary" ? 1 : 0))
        .map((a) => (
          <Button
            key={a.action}
            variant={a.tone === "danger" ? "danger" : a.tone === "secondary" ? "secondary" : "primary"}
            loading={transition.isPending && transition.variables?.action === a.action}
            onClick={() =>
              a.action === "approve" || a.action === "reject" ? setModal(a.action) : run(a.action)
            }
          >
            {t(`claims.actions.${a.action}`)}
          </Button>
        ))}

      <ApproveClaimModal
        open={modal === "approve"}
        onOpenChange={(open) => setModal(open ? "approve" : null)}
        pending={transition.isPending}
        onConfirm={({ resolution, comment }) => run("approve", { resolution, comment })}
      />
      <RejectClaimModal
        open={modal === "reject"}
        onOpenChange={(open) => setModal(open ? "reject" : null)}
        pending={transition.isPending}
        onConfirm={({ reason, message }) => run("reject", { reason, comment: message })}
      />
    </>
  );
}
