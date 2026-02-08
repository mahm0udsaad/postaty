"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Images, X } from "lucide-react";
import { compressImage } from "@/lib/image-compression";

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
  const [previews, setPreviews] = useState<string[]>(values);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = maxFiles - previews.length;
      const filesToProcess = acceptedFiles.slice(0, remaining);

      const promises = filesToProcess.map(async (file) => {
        try {
          return await compressImage(file, 2, 1920);
        } catch (error) {
          console.error("Error compressing image:", error);
          // Fallback to original if compression fails
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
    },
    [previews, maxFiles, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxSize: 5 * 1024 * 1024,
    disabled: previews.length >= maxFiles,
  });

  const handleRemove = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onChange(updated);
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
                alt={`صورة ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-slate-200"
              />
              <button
                onClick={() => handleRemove(i)}
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
            ${isDragActive ? "border-primary bg-primary/5" : "border-card-border hover:border-primary/50 hover:bg-slate-50"}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Images size={24} />
            <p className="text-sm">
              {isDragActive
                ? "أفلت الصور هنا"
                : `أضف صور (${previews.length}/${maxFiles})`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
