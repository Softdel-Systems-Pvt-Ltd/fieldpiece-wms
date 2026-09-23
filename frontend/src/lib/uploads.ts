import axios from "axios";
import type { Attachment } from "@/types";
import { ApiError } from "./api-error";
import { http } from "./http";

// Direct-to-storage uploads (backend Section 8.5 / ADR-008):
//   1. POST /attachments/upload-url  -> presigned PUT (5 min, type + length pinned)
//   2. PUT the file straight to storage (never through the API)
//   3. POST /attachments/{id}/confirm -> the worker scans it
//   4. poll GET /attachments/{id} until the scan is CLEAN (only clean files can be linked)

export type UploadOwner = Attachment["ownerType"];

interface UploadUrlResponse {
  attachment: Attachment;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: string;
}

const SCAN_POLL_MS = 700;
const SCAN_TIMEOUT_MS = 30_000;

/** Browsers don't always know the type (e.g. HEIC on Windows); fall back from the extension. */
function mimeOf(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "heic" ? "image/heic" : ext === "csv" ? "text/csv" : "application/octet-stream";
}

export async function uploadAttachment(
  file: File,
  ownerType: UploadOwner,
  onProgress?: (percent: number) => void,
): Promise<Attachment> {
  const { data } = await http.post<UploadUrlResponse>("/attachments/upload-url", {
    fileName: file.name,
    mimeType: mimeOf(file),
    sizeBytes: file.size,
    ownerType,
  });

  // A plain axios call: the storage URL must not receive our bearer token.
  await axios.put(data.uploadUrl, file, {
    headers: data.headers,
    onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
  });
  onProgress?.(100);

  await http.post(`/attachments/${data.attachment.id}/confirm`);
  return waitForScan(data.attachment.id);
}

async function waitForScan(id: string): Promise<Attachment> {
  const deadline = Date.now() + SCAN_TIMEOUT_MS;
  for (;;) {
    const { data } = await http.get<Attachment>(`/attachments/${id}`);
    if (data.scanStatus === "CLEAN") return data;
    if (data.scanStatus === "INFECTED" || data.scanStatus === "ERROR") {
      throw new ApiError(422, {
        code: "ATTACHMENT_INVALID",
        message: `${data.fileName} was rejected by the file check. Upload a different file.`,
      });
    }
    if (Date.now() > deadline) {
      throw new ApiError(422, {
        code: "ATTACHMENT_NOT_CLEAN",
        message: "The file check is taking longer than usual. Try again in a minute.",
      });
    }
    await new Promise((resolve) => setTimeout(resolve, SCAN_POLL_MS));
  }
}

/** Opens a short-lived download link for a clean attachment. */
export async function openAttachment(id: string): Promise<void> {
  const { data } = await http.get<{ url: string }>(`/attachments/${id}/download-url`);
  window.open(data.url, "_blank", "noopener");
}
