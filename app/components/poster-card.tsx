"use client";

import { useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  Download,
  Share2,
  Loader2,
  XCircle,
  Save,
  Sparkles,
  Maximize2,
} from "lucide-react";
import type { PosterResult } from "@/lib/types";
import { useLocale } from "@/hooks/use-locale";

// ── Export Helper ─────────────────────────────────────────────────

export async function exportPoster(result: PosterResult): Promise<void> {
  if (!result.imageBase64) return;

  const base64Data = result.imageBase64.includes(",")
    ? result.imageBase64.split(",")[1]
    : result.imageBase64;
  const mimeType = result.imageBase64.includes(",")
    ? result.imageBase64.split(",")[0].split(":")[1].split(";")[0]
    : "image/png";

  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `poster-${result.designNameAr || result.designIndex + 1}-${result.format}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── 3D Hover Effect Wrapper ──────────────────────────────────────

export function Card3DHover({
  children,
  className,
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8]);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000, rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ z: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Poster Card ───────────────────────────────────────────────────

export function PosterCard({
  result,
  onSaveAsTemplate,
  lowMotion,
  onClick,
}: {
  result: PosterResult;
  onSaveAsTemplate?: (designIndex: number) => void;
  lowMotion: boolean;
  onClick: () => void;
}) {
  const { t } = useLocale();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      await exportPoster(result);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [result]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!("share" in navigator)) return;
    try {
      if (!result.imageBase64) return;

      const base64Data = result.imageBase64.includes(",")
        ? result.imageBase64.split(",")[1]
        : result.imageBase64;
      const mimeType = result.imageBase64.includes(",")
        ? result.imageBase64.split(",")[0].split(":")[1].split(";")[0]
        : "image/png";

      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });

      const file = new File([blob], `poster-${result.format}.png`, {
        type: "image/png",
      });
      await navigator.share({ files: [file] });
    } catch {
      // User cancelled or share failed
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSaveAsTemplate) {
      onSaveAsTemplate(result.designIndex);
    }
  };

  if (result.status === "error") {
    return (
      <div className="bg-card border border-danger/30 rounded-2xl overflow-hidden shadow-md w-full">
        <div className="aspect-square bg-danger/5 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <XCircle size={32} className="text-danger" />
          <p className="text-sm text-danger font-medium">{t("فشل التصميم", "Design failed")}</p>
          {result.error && <p className="text-xs text-muted">{result.error}</p>}
        </div>
        <div className="p-3 text-center">
          <span className="text-xs text-muted">
            {t("تصميم", "Design")} {result.designIndex + 1}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card3DHover className="w-full h-full" disabled={lowMotion}>
      <motion.div
        initial={lowMotion ? false : { opacity: 0, y: 40, scale: 0.9 }}
        animate={lowMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={lowMotion ? undefined : { type: "spring" as const, damping: 15, stiffness: 100 }}
        className="group relative rounded-3xl overflow-hidden transition-all border border-card-border shadow-lg bg-surface-1 hover:shadow-xl cursor-pointer h-full flex flex-col"
        onClick={onClick}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-surface-2">
          {result.imageBase64 ? (
            <img
              src={result.imageBase64}
              alt={result.designNameAr || `${t("تصميم", "Design")} ${result.designIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Loader2 className="animate-spin" />
            </div>
          )}

          {/* AI badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-bold z-10">
            <Sparkles size={12} />
            AI
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 z-[5] flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Maximize2 className="text-white drop-shadow-md transform scale-50 group-hover:scale-100 transition-transform duration-300" size={32} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 flex items-center justify-between mt-auto bg-surface-1 relative z-10 border-t border-card-border">
          <span className="text-sm font-medium text-foreground/80 truncate max-w-[40%]">
            {result.designNameAr || `${t("تصميم", "Design")} ${result.designIndex + 1}`}
          </span>
          <div className="flex items-center gap-1.5">
            {onSaveAsTemplate && (
              <button
                type="button"
                onClick={handleSave}
                className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                title={t("حفظ كقالب", "Save as template")}
                aria-label={t("حفظ كقالب", "Save as template")}
              >
                <Save size={18} />
              </button>
            )}
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                title={t("مشاركة", "Share")}
                aria-label={t("مشاركة", "Share")}
              >
                <Share2 size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="p-2 rounded-lg text-muted hover:text-success hover:bg-success/10 transition-colors"
              title={t("تصدير PNG", "Export PNG")}
              aria-label={t("تصدير PNG", "Export PNG")}
            >
              {isExporting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </Card3DHover>
  );
}
