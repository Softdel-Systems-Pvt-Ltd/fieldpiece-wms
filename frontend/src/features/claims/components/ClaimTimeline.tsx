import { ArrowRightLeft, FilePlus2, MessageSquare, Paperclip, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { ErrorState, Skeleton } from "@/components/feedback";
import { Button, Textarea, Timeline, type TimelineItem } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/session";
import type { ClaimEvent } from "@/types";
import { useAddComment, useClaimEvents } from "../hooks";

const eventIcon = {
  created: FilePlus2,
  status_changed: ArrowRightLeft,
  comment: MessageSquare,
  attachment_added: Paperclip,
  assigned: UserPlus,
} as const;

// Internal notes are filtered out by the API for customer roles (backend Section 11.3); the toggle here
// only decides whether staff can write one.

export function ClaimTimeline({ claimId }: { claimId: string }) {
  const { t, i18n } = useTranslation();
  const role = useCurrentRole();
  const canInternal = can(role, "claims:internal_notes");
  const events = useClaimEvents(claimId);
  const addComment = useAddComment(claimId);
  const [comment, setComment] = useState("");
  const [internal, setInternal] = useState(false);

  const describe = (e: ClaimEvent) => {
    if (e.type === "status_changed" && e.toStatus)
      return t("claims.event.statusChanged", { status: t(`status.claim.${e.toStatus}`) });
    return t(`claims.event.${e.type}`);
  };

  const items: TimelineItem[] = (events.data?.items ?? []).map((e) => ({
    id: e.id,
    icon: eventIcon[e.type],
    actor: e.actor.name,
    action: describe(e),
    timestamp: formatDateTime(e.at, i18n.language),
    comment: e.comment ?? undefined,
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
      {events.isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : events.error ? (
        <ErrorState error={events.error} onRetry={() => void events.refetch()} />
      ) : (
        <Timeline items={items} />
      )}
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
