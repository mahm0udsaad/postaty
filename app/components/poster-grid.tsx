"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  DownloadCloud,
} from "lucide-react";
import type { PosterResult, PosterGenStep, MarketingContent, MarketingContentStatus } from "@/lib/types";
import { LoadingSlideshow } from "./loading-slideshow";
import { PosterModal } from "./poster-modal";
import { useLocale } from "@/hooks/use-locale";

// ── Modular imports ──────────────────────────────────────────────
import { PosterSkeleton } from "./poster-skeleton";
import { PosterCard, exportPoster } from "./poster-card";
import { MarketingContentPanel } from "./marketing-content-panel";

// ── Props ─────────────────────────────────────────────────────────

interface PosterGridProps {
  results: PosterResult[];
  genStep: PosterGenStep;
  error?: string;
  totalExpected?: number;
  onSaveAsTemplate?: (designIndex: number) => void;
  marketingContent?: MarketingContent | null;
  marketingStatus?: MarketingContentStatus;
  onRetryMarketingContent?: () => void;
  templateSaveStatus?: "idle" | "saving" | "saved" | "error";
  businessName?: string;
  businessLogo?: string;
}

// ── Main Component ────────────────────────────────────────────────

export function PosterGrid({
  results,
  genStep,
  error,
  totalExpected = results.length || 3,
  onSaveAsTemplate,
  marketingContent,
  marketingStatus = "idle",
  onRetryMarketingContent,
  templateSaveStatus = "idle",
  businessName,
  businessLogo,
}: PosterGridProps) {
  const { t } = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const isLoading = genStep === "generating-designs";
  const [exportingAll, setExportingAll] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  // Modal State
  const [selectedResult, setSelectedResult] = useState<PosterResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 768px), (hover: none) and (pointer: coarse)"
    );
    const onMediaChange = () => setIsCoarsePointer(mediaQuery.matches);

    onMediaChange();
    mediaQuery.addEventListener("change", onMediaChange);
    return () => mediaQuery.removeEventListener("change", onMediaChange);
  }, []);

  const lowMotionMode = Boolean(shouldReduceMotion) || isCoarsePointer;
  const successResults = results.filter((r) => r.status === "complete");

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      for (const result of successResults) {
        await exportPoster(result);
      }
    } finally {
      setExportingAll(false);
    }
  };

  const handleCardClick = (result: PosterResult) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  // Create grid items for all expected indices
  const displayCount = Math.max(totalExpected, results.length);
  const gridItems = Array.from({ length: displayCount }, (_, i) => i);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  // Show slideshow if loading and NO results yet
  if (isLoading && results.length === 0) {
    return (
      <div className="py-8 animate-in fade-in duration-700">
        <LoadingSlideshow />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {genStep === "complete" && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 px-6 bg-success/5 border border-success/20 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-full">
              <CheckCircle2 size={24} className="text-success" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {t("تم اكتمال التصميم!", "Design completed!")}
              </h3>
              <p className="text-muted text-sm">
                {t("تم إنشاء التصميم بنجاح", "Design generated successfully")}
              </p>
            </div>
          </div>

          {successResults.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportAll}
                disabled={exportingAll}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 font-medium"
              >
                {exportingAll ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <DownloadCloud size={18} />
                )}
                {t("تصدير التصميم", "Export design")}
              </button>
            </div>
          )}
        </div>
      )}

      {templateSaveStatus !== "idle" && (
        <div className={`flex items-center gap-3 py-3 px-5 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${
          templateSaveStatus === "saving" ? "bg-primary/5 border border-primary/20 text-primary" :
          templateSaveStatus === "saved" ? "bg-success/5 border border-success/20 text-success" :
          "bg-danger/5 border border-danger/20 text-danger"
        }`}>
          {templateSaveStatus === "saving" && <Loader2 size={16} className="animate-spin" />}
          {templateSaveStatus === "saved" && <CheckCircle2 size={16} />}
          {templateSaveStatus === "error" && <XCircle size={16} />}
          <span>
            {templateSaveStatus === "saving" && t("جاري حفظ القالب...", "Saving template...")}
            {templateSaveStatus === "saved" && t("تم حفظ القالب بنجاح!", "Template saved successfully!")}
            {templateSaveStatus === "error" && t("فشل حفظ القالب. حاول مرة أخرى.", "Failed to save template. Try again.")}
          </span>
        </div>
      )}

      {genStep === "error" && (
        <div role="alert" className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-danger/10 rounded-full">
            <XCircle size={40} className="text-danger" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{t("عذراً، حدث خطأ", "Sorry, an error occurred")}</h3>
          {error && (
            <p className="max-w-md mx-auto text-muted bg-danger/5 border border-danger/10 rounded-lg p-3 text-sm">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Poster Grid */}
      {(results.length > 0 || isLoading) && (
        <motion.div
          variants={lowMotionMode ? undefined : containerVariants}
          initial={lowMotionMode ? false : "hidden"}
          animate={lowMotionMode ? undefined : "show"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {gridItems.map((index) => {
            const result = results.find((r) => r.designIndex === index);
            if (result) {
              return (
                <div key={result.designIndex} className="w-full">
                  <PosterCard
                    result={result}
                    onSaveAsTemplate={onSaveAsTemplate}
                    lowMotion={lowMotionMode}
                    onClick={() => handleCardClick(result)}
                  />
                </div>
              );
            }

            if (isLoading) {
              return (
                <div key={`skeleton-${index}`} className="w-full">
                  <PosterSkeleton
                    index={index}
                    lowMotion={lowMotionMode}
                  />
                </div>
              );
            }
            return null;
          })}
        </motion.div>
      )}

      {/* Marketing Content Panel */}
      <MarketingContentPanel
        content={marketingContent ?? null}
        status={marketingStatus}
        posterImage={successResults[0]?.imageBase64}
        businessName={businessName}
        businessLogo={businessLogo}
        onRetry={onRetryMarketingContent}
        t={t}
      />

      {/* Full Screen Modal */}
      <PosterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        result={selectedResult}
        onSaveAsTemplate={onSaveAsTemplate}
      />
    </div>
  );
}
