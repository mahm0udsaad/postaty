"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, X, AlertTriangle, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/image-compression";
import { useLocale } from "@/hooks/use-locale";

interface ImageUploadProps {
  label: string;
  value: string | null;
  onChange: (base64: string | null) => void;
  accept?: Record<string, string[]>;
}

export function ImageUpload({
  label,
  value,
  onChange,
  accept = { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
}: ImageUploadProps) {
  const { t } = useLocale();
  const [preview, setPreview] = useState<string | null>(value);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionWarning, setCompressionWarning] = useState<string | null>(null);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsCompressing(true);
      setCompressionWarning(null);

      try {
        const compressedBase64 = await compressImage(file, 2, 1920);
        setPreview(compressedBase64);
        onChange(compressedBase64);
      } catch (error) {
        console.error("Error compressing image:", error);
        // Fall back to uncompressed, but warn if file is large
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          if (file.size > 2 * 1024 * 1024) {
            setCompressionWarning(
              t("لم نتمكن من ضغط الصورة. قد يكون حجمها كبيراً.", "Could not compress image. It may be large and slow to upload.")
            );
          }
          setPreview(base64);
          onChange(base64);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    },
    [onChange, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-2 text-foreground/80">
        {label}
      </label>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300
          ${isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-card-border hover:border-primary/50 hover:bg-surface-2"}
          ${preview ? "p-2 border-solid border-card-border" : "p-8"}`}
      >
        <input {...getInputProps()} />
        {isCompressing ? (
          <div className="flex flex-col items-center gap-3 py-6 text-muted">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-sm font-medium">{t("جاري ضغط الصورة...", "Compressing image...")}</p>
          </div>
        ) : preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt={t("معاينة", "Preview")}
              className="w-full h-48 object-contain rounded-xl shadow-sm bg-surface-1"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <p className="text-white font-medium text-sm">{t("انقر للتغيير", "Click to change")}</p>
            </div>
            <button
              onClick={handleRemove}
              aria-label={t("إزالة الصورة", "Remove image")}
              className="absolute top-2 left-2 bg-surface-1 text-danger rounded-full p-1.5 shadow-md hover:bg-danger hover:text-white transition-all transform hover:scale-110"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className={`p-4 rounded-full ${isDragActive ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted"}`}>
              <ImagePlus size={32} />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {isDragActive ? t("أفلت الصورة هنا", "Drop image here") : t("اضغط لرفع صورة", "Click to upload image")}
              </p>
              <p className="text-xs text-muted-foreground">{t("أو اسحب وأفلت هنا", "or drag and drop here")}</p>
            </div>
            <p className="text-[10px] uppercase tracking-wider opacity-60 bg-surface-2 px-2 py-1 rounded text-muted">PNG, JPG, WEBP • Max 5MB</p>
          </div>
        )}
      </div>
      {compressionWarning && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 text-xs">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{compressionWarning}</span>
        </div>
      )}
    </div>
  );
}
