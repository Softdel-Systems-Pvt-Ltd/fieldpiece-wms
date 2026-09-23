import { CheckCircle2, Download, FileWarning, Upload } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/feedback";
import { PageHeader } from "@/components/layout";
import { Button, Card, FileDropzone, type UploadItem } from "@/components/ui";
import { toApiError } from "@/lib/api-error";
import { formatNumber } from "@/lib/format";
import { uploadAttachment } from "@/lib/uploads";
import { registrationsApi } from "../api";
import { useImportStatus } from "../hooks";

// Section 8.3 bulk registration: template -> upload CSV -> the worker validates every row and imports the
// valid ones -> progress and an error report for the rest. Limit: 10,000 rows per file.

export default function BulkRegistrationPage() {
  const { t, i18n } = useTranslation();
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [starting, setStarting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const status = useImportStatus(jobId);
  const job = status.data;

  const downloadTemplate = async () => {
    try {
      const csv = await registrationsApi.importTemplate();
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const link = Object.assign(document.createElement("a"), {
        href: url,
        download: "registration-import-template.csv",
      });
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  };

  const start = async () => {
    const file = files[0]?.file;
    if (!file) return;
    setStarting(true);
    try {
      const attachment = await uploadAttachment(file, "import", (progress) => setFiles([{ file, progress }]));
      const started = await registrationsApi.startImport(attachment.id);
      setJobId(started.jobId);
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setStarting(false);
    }
  };

  const running = job && (job.state === "queued" || job.state === "running");
  const n = (value: number) => formatNumber(value, i18n.language);

  return (
    <>
      <PageHeader
        title={t("registrations.bulkTitle")}
        breadcrumbs={[
          { label: t("registrations.title"), to: "/registrations" },
          { label: t("registrations.bulk") },
        ]}
        actions={
          <Button variant="secondary" icon={Download} onClick={() => void downloadTemplate()}>
            {t("registrations.csvTemplate")}
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("registrations.uploadCsv")}>
          <p className="mb-4 text-body text-text-muted">{t("registrations.bulkIntro")}</p>
          <FileDropzone
            value={files}
            onChange={(items) => {
              setFiles(items.slice(-1));
              setJobId(null);
            }}
            maxFiles={1}
            accept={{ "text/csv": [".csv"] }}
            hint={t("registrations.csvHint")}
            onReject={(m) => m.forEach((msg) => toast.error(msg))}
          />
          <Button
            className="mt-4"
            icon={Upload}
            disabled={!files.length || !!running}
            loading={starting}
            onClick={() => void start()}
          >
            {t("registrations.startImport")}
          </Button>
        </Card>

        <Card title={t("registrations.importResult")} aria-live="polite">
          {!job ? (
            <p className="text-body text-text-muted">{t("registrations.importIdle")}</p>
          ) : (
            <div className="space-y-4">
              <p className="text-overline text-text-muted">{t(`registrations.importState.${job.state}`)}</p>
              {job.state !== "failed" ? (
                <div
                  className="h-2 w-full overflow-hidden rounded-sm bg-ink-100"
                  role="progressbar"
                  aria-valuenow={job.processed}
                  aria-valuemin={0}
                  aria-valuemax={job.total || undefined}
                >
                  <div
                    className="h-full bg-ink-1000 transition-[width]"
                    style={{
                      width:
                        job.state === "completed"
                          ? "100%"
                          : job.total
                            ? `${(job.processed / job.total) * 100}%`
                            : "10%",
                    }}
                  />
                </div>
              ) : null}
              <dl className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <dt className="text-overline text-text-muted">{t("registrations.rows")}</dt>
                  <dd className="font-mono text-h2">{n(job.total)}</dd>
                </div>
                <div>
                  <dt className="text-overline text-text-muted">{t("registrations.imported")}</dt>
                  <dd className="font-mono text-h2 text-success">{n(job.succeeded)}</dd>
                </div>
                <div>
                  <dt className="text-overline text-text-muted">{t("registrations.rejected")}</dt>
                  <dd className="font-mono text-h2 text-danger">{n(job.failed)}</dd>
                </div>
              </dl>
              {job.message ? (
                <p className="rounded bg-danger-bg p-3 text-sm text-danger">{job.message}</p>
              ) : null}
              {job.state === "completed" && job.failed === 0 ? (
                <p className="flex items-center gap-2 text-success">
                  <CheckCircle2 size={20} aria-hidden /> {t("registrations.importClean")}
                </p>
              ) : null}
              {job.errorReportUrl ? (
                <a
                  href={job.errorReportUrl}
                  className="inline-flex items-center gap-2 font-semibold text-info underline"
                >
                  <FileWarning size={16} aria-hidden /> {t("registrations.errorReport")}
                </a>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
