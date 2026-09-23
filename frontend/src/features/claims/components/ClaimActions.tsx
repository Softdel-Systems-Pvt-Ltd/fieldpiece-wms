import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/feedback";
import { Button } from "@/components/ui";
import type { Claim, ClaimAction } from "@/types";
import { useClaimTransition } from "../hooks";
import { ACTION_META, orderActions } from "../transitions";
import type { TransitionBody } from "../types";
import { ApproveClaimModal } from "./ApproveClaimModal";
import { MessageModal } from "./MessageModal";
import { RejectClaimModal } from "./RejectClaimModal";

// Renders exactly the actions the API allows this user right now (claim.allowedActions, Section 7.1).

export function ClaimActions({ claim }: { claim: Claim }) {
  const { t } = useTranslation();
  const transition = useClaimTransition(claim.id);
  const [open, setOpen] = useState<ClaimAction | null>(null);

  if (!claim.allowedActions.length) return null;

  const run = (action: ClaimAction, body?: TransitionBody) =>
    transition.mutate(
      { action, version: claim.version, body },
      {
        onSuccess: () => {
          setOpen(null);
          toast.success(t(`claims.done.${action}`));
        },
      },
    );

  const pendingFor = (action: ClaimAction) => transition.isPending && transition.variables?.action === action;
  const messageAction = open && ["requestInfo", "respond", "close"].includes(open) ? open : null;

  return (
    <>
      {orderActions(claim.allowedActions).map((action) => {
        const meta = ACTION_META[action];
        return (
          <Button
            key={action}
            variant={meta.tone === "danger" ? "danger" : meta.tone === "secondary" ? "secondary" : "primary"}
            loading={pendingFor(action)}
            onClick={() => (meta.input === "none" ? run(action) : setOpen(action))}
          >
            {t(`claims.actions.${action}`)}
          </Button>
        );
      })}

      <ApproveClaimModal
        open={open === "approve"}
        onOpenChange={(next) => setOpen(next ? "approve" : null)}
        pending={pendingFor("approve")}
        preferred={claim.preferredResolution}
        onConfirm={({ resolution, comment }) => run("approve", { resolution, comment: comment || undefined })}
      />
      <RejectClaimModal
        open={open === "reject"}
        onOpenChange={(next) => setOpen(next ? "reject" : null)}
        pending={pendingFor("reject")}
        onConfirm={({ reason, message }) => run("reject", { reason, message })}
      />
      {messageAction ? (
        <MessageModal
          open
          onOpenChange={(next) => !next && setOpen(null)}
          title={t(`claims.actions.${messageAction}`)}
          label={t(`claims.messageLabel.${messageAction}`)}
          confirmLabel={t(`claims.actions.${messageAction}`)}
          required={ACTION_META[messageAction].input === "message"}
          pending={pendingFor(messageAction)}
          onConfirm={(message) => run(messageAction, message ? { message } : {})}
        />
      ) : null}
    </>
  );
}
