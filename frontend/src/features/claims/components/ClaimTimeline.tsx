import { ArrowRightLeft, FilePlus2, MessageSquare, Paperclip, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button, Textarea, Timeline, type TimelineItem } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/session";
import type { Claim, ClaimEvent } from "@/types";
import { useAddComment } from "../hooks";

const eventIcon = {
  created: FilePlus2,
  status_changed: ArrowRightLeft,
  comment: MessageSquare,
  attachment_added: Paperclip,
  assigned: UserPlus,
} as const;

export function ClaimTimeline({ claim }: { claim: Claim }) {
  const { t, i18n } = useTranslation();
  const role = useCurrentRole();
  const canInternal = can(role, "claims:internal_notes");
  const addComment = useAddComment(claim.id);
  const [comment, setComment] = useState("");
  const [internal, setInternal] = useState(false);

  // Belt and braces: the API already strips internal notes for customers.
  const events = claim.history.filter((e) => canInternal || !e.internal);

  const describe = (e: ClaimEvent) => {
    if (e.type === "status_changed" && e.to) return `→ ${t(`status.claim.${e.to}`)}`;
    if (e.type === "created") return t("status.claim.SUBMITTED").toLowerCase();
    return e.type.replace("_", " ");
  };

  const items: TimelineItem[] = events.map((e, index) => ({
    id: `${e.at}-${index}`,
    icon: eventIcon[e.type],
    actor: e.actor.name,
    action: describe(e),
    timestamp: formatDateTime(e.at, i18n.language),
    comment: e.comment,
    internal: e.internal,
    internalLabel: t("claims.internal"),
  }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = comment.trim();
    if (!text) return;
    addComment.mutate(
      { comment: text, internal: canInternal && internal },
      { onSuccess: () => setComment("") },
    );
  };

  return (
    <div className="space-y-6">
      <Timeline items={items} />
      <form onSubmit={onSubmit} className="space-y-2 border-t border-border pt-4">
        <label htmlFor="claim-comment" className="text-sm font-semibold">
          {t("claims.addComment")}
        </label>
        <Textarea
          id="claim-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("claims.commentPlaceholder")}
          className={internal ? "border-s-4 border-s-brand-500" : undefined}
        />
        <div className="flex items-center justify-between gap-2">
          {canInternal ? (
            <label className="inline-flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
                className="h-4 w-4 rounded-sm border-ink-400 text-ink-1000 focus:ring-ink-1000"
              />
              {t("claims.internalNote")}
            </label>
          ) : (
            <span />
          )}
          <Button type="submit" variant="secondary" loading={addComment.isPending} disabled={!comment.trim()}>
            {t("claims.addComment")}
          </Button>
        </div>
      </form>
    </div>
  );
}
