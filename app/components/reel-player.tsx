"use client";

import { useState } from "react";
import { Download, Share2, Loader2 } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";

interface ReelPlayerProps {
  videoUrl: string;
  fileName?: string;
}

export function ReelPlayer({ videoUrl, fileName = "reel.mp4" }: ReelPlayerProps) {
  const { t } = useLocale();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!("share" in navigator)) return;
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: "video/mp4" });
      await navigator.share({ files: [file] });
    } catch {
      // User cancelled or share failed
    }
  };

  return (
    <div className="space-y-4">
      {/* Video */}
      <div className="relative aspect-[9/16] max-h-[60vh] mx-auto rounded-2xl overflow-hidden shadow-xl bg-black">
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="w-full h-full object-contain"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors active:scale-95"
        >
          {isDownloading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Download size={18} />
          )}
          {t("تحميل MP4", "Download MP4")}
        </button>

        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-1 border border-card-border text-foreground rounded-xl font-medium hover:bg-surface-2 transition-colors active:scale-95"
          >
            <Share2 size={18} />
            {t("مشاركة", "Share")}
          </button>
        )}
      </div>
    </div>
  );
}
