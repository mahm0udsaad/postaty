"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Images, X, Loader2, AlertTriangle } from "lucide-react";
import { compressImage } from "@/lib/image-compression";
import { useLocale } from "@/hooks/use-locale";

interface MultiImageUploadProps {
  label: string;
  values: string[];
  onChange: (base64s: string[]) => void;
  maxFiles?: number;
}

export function MultiImageUpload({
  label,
  values,
  onChange,
  maxFiles = 5,
}: MultiImageUploadProps) {
  const { t } = useLocale();
  const [previews, setPreviews] = useState<string[]>(values);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionWarning, setCompressionWarning] = useState<string | null>(null);

  useEffect(() => {
    setPreviews(values);
  }, [values]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = maxFiles - previews.length;
      const filesToProcess = acceptedFiles.slice(0, remaining);

      setIsCompressing(true);
      setCompressionWarning(null);
      let hadFallback = false;

      const promises = filesToProcess.map(async (file) => {
        try {
          return await compressImage(file, 2, 1920);
        } catch (error) {
          console.error("Error compressing image:", error);
          if (file.size > 2 * 1024 * 1024) hadFallback = true;
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }
      });

      const newBase64s = await Promise.all(promises);
      const updated = [...previews, ...newBase64s];
      setPreviews(updated);
      onChange(updated);
      setIsCompressing(false);

      if (hadFallback) {
        setCompressionWarning(
          t("لم نتمكن من ضغط بعض الصور. قد يكون حجمها كبيراً.", "Could not compress some images. They may be large and slow to upload.")
        );
      }
    },
    [previews, maxFiles, onChange, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxSize: 5 * 1024 * 1024,
    disabled: previews.length >= maxFiles || isCompressing,
  });

  const handleRemove = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onChange(updated);
    if (updated.length === 0) setCompressionWarning(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-foreground">
        {label}
      </label>
      {previews.length > 0 && (
        <div className="flex gap-3 mb-3 flex-wrap">
          {previews.map((preview, i) => (
            <div key={i} className="relative w-24 h-24">
              <img
                src={preview}
                alt={`${t("صورة", "Image")} ${i + 1} ${t("من", "of")} ${previews.length}`}
                className="w-full h-full object-cover rounded-lg border border-card-border"
              />
              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {i + 1}
              </span>
              <button
                onClick={() => handleRemove(i)}
                aria-label={`${t("إزالة الصورة", "Remove image")} ${i + 1}`}
                className="absolute -top-2 -left-2 bg-danger text-white rounded-full p-0.5 hover:bg-danger/80 transition-colors shadow-sm"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {previews.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-primary bg-primary/5" : "border-card-border hover:border-primary/50 hover:bg-surface-2"}
            ${isCompressing ? "pointer-events-none opacity-70" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            {isCompressing ? (
              <>
                <Loader2 size={24} className="animate-spin text-primary" />
                <p className="text-sm font-medium">{t("جاري ضغط الصور...", "Compressing images...")}</p>
              </>
            ) : (
              <>
                <Images size={24} />
                <p className="text-sm">
                  {isDragActive
                    ? t("أفلت الصور هنا", "Drop images here")
                    : `${t("أضف صور", "Add images")} (${previews.length}/${maxFiles})`}
                </p>
              </>
            )}
          </div>
        </div>
      )}
      {compressionWarning && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 text-xs">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{compressionWarning}</span>
        </div>
      )}
    </div>
  );
}
