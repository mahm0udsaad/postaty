"use client";

import { useState } from "react";
import { Download, Share2, Loader2, AlertCircle } from "lucide-react";
import type { GenerationResult } from "@/lib/types";
import { FORMAT_CONFIGS } from "@/lib/constants";
import { useLocale } from "@/hooks/use-locale";

interface PosterPreviewProps {
  result: GenerationResult;
}

export function PosterPreview({ result }: PosterPreviewProps) {
  const { t } = useLocale();
  const config = FORMAT_CONFIGS[result.format];
  const [isDownloading, setIsDownloading] = useState(false);

  // Support both base64 (immediate preview) and storage URL (from history)
  const imageSrc = result.imageBase64
    ? `data:image/png;base64,${result.imageBase64}`
    : result.storageUrl || "";

  const handleDownload = async () => {
    if (!imageSrc) return;

    setIsDownloading(true);
    try {
      if (result.storageUrl && !result.imageBase64) {
        const response = await fetch(result.storageUrl);
        if (!response.ok) throw new Error("Failed to fetch image");
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `poster-${result.format}.png`;
        link.click();
        URL.revokeObjectURL(link.href);
      } else {
        const link = document.createElement("a");
        link.href = imageSrc;
        link.download = `poster-${result.format}.png`;
        link.click();
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert(t("حدث خطأ أثناء تحميل الصورة. يرجى المحاولة مرة أخرى.", "An error occurred while downloading the image. Please try again."));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!imageSrc || !navigator.share) return;

    try {
      let blob: Blob;
      if (imageSrc.startsWith("data:")) {
        const [header, base64] = imageSrc.split(",");
        const mime = header.match(/:(.*?);/)?.[1] || "image/png";
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
        blob = new Blob([array], { type: mime });
      } else {
        const response = await fetch(imageSrc);
        if (!response.ok) throw new Error("Failed to fetch image");
        blob = await response.blob();
      }

      const file = new File([blob], `poster-${result.format}.png`, {
        type: blob.type || "image/png",
      });

      await navigator.share({
        files: [file],
        title: t("بوستر العرض", "Promotional poster"),
      });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  return (
    <div className="bg-white border border-card-border rounded-3xl overflow-hidden shadow-soft hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-4 border-b border-card-border/50 bg-slate-50/50">
        <h3 className="text-sm font-bold text-center text-foreground">{config.label}</h3>
        <p className="text-[10px] text-muted text-center uppercase tracking-wider mt-1">{config.aspectRatio}</p>
      </div>

      <div className="p-6 flex justify-center items-center min-h-[240px] bg-slate-50/30">
        {result.status === "generating" || result.status === "pending" ? (
          <div className="flex flex-col items-center gap-3">
             <Loader2 size={32} className="animate-spin text-primary" />
             <p className="text-sm text-muted animate-pulse">{t("جاري المعالجة...", "Processing...")}</p>
          </div>
        ) : result.status === "error" ? (
          <div className="flex flex-col items-center gap-3 text-danger p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
                <AlertCircle size={24} />
            </div>
            <p className="text-sm font-medium">{result.error || t("حدث خطأ أثناء الإنشاء", "An error occurred while generating")}</p>
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={`${t("بوستر", "Poster")} ${config.label}`}
            className="max-w-full max-h-[400px] object-contain rounded-xl shadow-md"
          />
        )}
      </div>

      {result.status === "complete" && (
        <div className="p-4 border-t border-card-border/50 bg-white grid grid-cols-2 gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isDownloading ? t("جاري...", "Downloading...") : t("تحميل", "Download")}
          </button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-card-border rounded-xl hover:bg-slate-50 hover:border-primary/30 hover:text-primary transition-all text-sm font-medium text-muted-foreground"
            >
              <Share2 size={16} />
              {t("مشاركة", "Share")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
