import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/feedback";
import { Button } from "@/components/ui";
import { toApiError } from "@/lib/api-error";
import type { Product } from "@/types";
import { useRemoveProductImage, useUploadProductImage } from "../hooks";
import { PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES } from "../types";

/** Admin-only: replace or remove the product photo. The API re-checks type and size; this just fails fast. */
export function ProductPhotoEditor({ product }: { product: Product }) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const upload = useUploadProductImage(product.sku);
  const remove = useRemoveProductImage(product.sku);

  const onFile = (file: File | undefined) => {
    if (input.current) input.current.value = "";
    if (!file) return;
    if (!(PRODUCT_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      toast.error(t("products.photo.wrongType"));
      return;
    }
    if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
      toast.error(t("products.photo.tooLarge"));
      return;
    }
    upload.mutate(
      { file, onProgress: setProgress },
      {
        onSuccess: () => toast.success(t("products.photo.saved")),
        onError: (error) => toast.error(toApiError(error).message),
        onSettled: () => setProgress(null),
      },
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={input}
        type="file"
        accept={PRODUCT_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <Button
        variant="secondary"
        size="sm"
        icon={ImagePlus}
        loading={upload.isPending}
        onClick={() => input.current?.click()}
      >
        {progress !== null && progress < 100
          ? t("products.photo.uploading", { percent: progress })
          : product.imageUrl
            ? t("products.photo.change")
            : t("products.photo.add")}
      </Button>
      {product.imageUrl ? (
        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          loading={remove.isPending}
          disabled={upload.isPending}
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () => toast.success(t("products.photo.removed")),
              onError: (error) => toast.error(toApiError(error).message),
            })
          }
        >
          {t("products.photo.remove")}
        </Button>
      ) : null}
      <p className="w-full text-sm text-text-muted">{t("products.photo.hint")}</p>
    </div>
  );
}
