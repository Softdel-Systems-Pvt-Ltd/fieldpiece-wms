import { FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/feedback";
import { toApiError } from "@/lib/api-error";
import { formatFileSize } from "@/lib/format";
import { openAttachment } from "@/lib/uploads";
import type { Attachment } from "@/types";

// Files stay in a private bucket; each click fetches a 5-minute presigned download link (backend 8.5).
// TODO: thumbnail gallery with a lightbox (Section 8.5) once the worker generates EXIF-stripped thumbnails.

export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  const { t } = useTranslation();
  if (!attachments.length) return <p className="text-sm text-text-muted">{t("claims.noAttachments")}</p>;

  const open = (id: string) =>
    openAttachment(id).catch((error: unknown) => toast.error(toApiError(error).message));

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {attachments.map((a) => {
        const Icon =
          a.scanStatus === "PENDING" ? Loader2 : a.mimeType.startsWith("image/") ? ImageIcon : FileText;
        return (
          <li key={a.id}>
            <button
              type="button"
              disabled={a.scanStatus !== "CLEAN"}
              onClick={() => void open(a.id)}
              className="flex min-h-11 w-full items-center gap-3 rounded border border-border p-2 text-start hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon
                size={20}
                strokeWidth={1.75}
                aria-hidden
                className={a.scanStatus === "PENDING" ? "animate-spin" : undefined}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{a.fileName}</span>
                <span className="text-xs text-text-muted">
                  {formatFileSize(a.sizeBytes)}
                  {a.scanStatus !== "CLEAN" ? ` · ${t(`claims.scan.${a.scanStatus}`)}` : ""}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
