// Upload allow-list and magic-byte sniffing (build guide Section 8.5). Pure functions.

export const OWNER_TYPES = ["registration", "claim", "rma", "import"] as const;
export type OwnerType = (typeof OWNER_TYPES)[number];

const IMAGES_AND_PDF = ["image/jpeg", "image/png", "image/heic", "image/webp", "application/pdf"] as const;
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export const ALLOWED_MIME: Record<OwnerType, readonly string[]> = {
  registration: IMAGES_AND_PDF,
  claim: [...IMAGES_AND_PDF, "video/mp4"],
  rma: IMAGES_AND_PDF,
  import: ["text/csv"],
};

export function maxBytesFor(mime: string, defaultMax: number): number {
  return mime === "video/mp4" ? VIDEO_MAX_BYTES : defaultMax;
}

export const IMAGE_MIME: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/webp",
]);

const ascii = (buf: Buffer, start: number, end: number) => buf.subarray(start, end).toString("latin1");

/**
 * Checks the file's first bytes against its declared type. Never trust the client's Content-Type alone.
 * Returns true when the content plausibly is what it claims to be.
 */
export function matchesSignature(mime: string, head: Buffer): boolean {
  switch (mime) {
    case "image/jpeg":
      return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case "image/png":
      return head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/webp":
      return ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP";
    case "image/heic":
      return (
        ascii(head, 4, 8) === "ftyp" && ["heic", "heix", "mif1", "msf1", "hevc"].includes(ascii(head, 8, 12))
      );
    case "video/mp4":
      return ascii(head, 4, 8) === "ftyp";
    case "application/pdf":
      return ascii(head, 0, 5) === "%PDF-";
    case "text/csv":
      // No magic number for CSV: require text (no NUL bytes) in the sample.
      return head.length > 0 && !head.includes(0x00);
    default:
      return false;
  }
}

/** Random, non-guessable storage key; never the user's file name (Section 8.5). */
export function storageKeyFor(ownerType: OwnerType, id: string, now: Date): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${ownerType}s/${yyyy}/${mm}/${id}`;
}
