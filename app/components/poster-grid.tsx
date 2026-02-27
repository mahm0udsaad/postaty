"use client";

import { useState, useCallback, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Download,
  Share2,
  Loader2,
  CheckCircle2,
  XCircle,
  Save,
  DownloadCloud,
  Sparkles,
  Palette,
  Brain,
  Maximize2,
  Megaphone,
  LayoutGrid,
} from "lucide-react";
import type { PosterResult, PosterGenStep } from "@/lib/types";
import { LoadingSlideshow } from "./loading-slideshow";
import { PosterModal } from "./poster-modal";
import { useLocale } from "@/hooks/use-locale";

// ── Props ─────────────────────────────────────────────────────────

interface PosterGridProps {
  results: PosterResult[];
  genStep: PosterGenStep;
  error?: string;
  totalExpected?: number;
  onSaveAsTemplate?: (designIndex: number) => void;
  onGenerateMore?: () => void;
  onReset?: () => void;
  canGenerateMore?: boolean;
  generateMoreLabel?: string;
}

// ── Poster Skeleton (Advanced Generative Visualization) ───────────

const LOADING_LOGS = [
  ">> Initializing creative tensor cores...",
  ">> Analyzing brand semantic context...",
  ">> Constructing layout geometry...",
  ">> Sampling high-fidelity textures...",
  ">> Optimizing color harmony...",
  ">> Rendering typographic elements...",
  ">> Applying post-processing filters...",
  ">> Finalizing export buffer...",
];

// ── Phase 1: Wireframe / Blueprint Construction
function SkeletonLayoutPhase() {
  const draw: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.2, type: "spring" as const, duration: 1.5, bounce: 0 },
        opacity: { delay: i * 0.2, duration: 0.01 },
      },
    }),
  };

  return (
    <div className="absolute inset-0 p-6 flex flex-col">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
      />
      
      <motion.svg className="w-full h-full stroke-primary/40 stroke-[2] fill-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Header Image Area */}
        <motion.rect
          x="0" y="0" width="100" height="60" rx="5"
          variants={draw} custom={0} initial="hidden" animate="visible"
        />
        {/* Title Line */}
        <motion.line
          x1="10" y1="70" x2="60" y2="70"
          variants={draw} custom={1} initial="hidden" animate="visible"
        />
        {/* Subtitle Line */}
        <motion.line
          x1="10" y1="80" x2="40" y2="80"
          variants={draw} custom={2} initial="hidden" animate="visible"
        />
        {/* Price Tag Circle */}
        <motion.circle
          cx="85" cy="75" r="10"
          variants={draw} custom={3} initial="hidden" animate="visible"
        />
        {/* Button Rect */}
        <motion.rect
          x="65" y="90" width="35" height="10" rx="2"
          variants={draw} custom={4} initial="hidden" animate="visible"
        />
      </motion.svg>
      
      {/* Floating Blueprint Label */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-xs font-mono border border-blue-500/20 backdrop-blur-sm"
      >
        LAYOUT_ENGINE_V2
      </motion.div>
    </div>
  );
}

// ── Phase 2: Color Injection
function SkeletonColorPhase() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated Gradient Blobs */}
      <motion.div
        className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], x: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.5, 1], y: [0, -20, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      
      <div className="absolute inset-0 flex items-center justify-center flex-col gap-6">
        <div className="flex gap-4">
           {[1, 2, 3].map((i) => (
             <motion.div
               key={i}
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: i * 0.2, type: "spring" }}
               className="w-12 h-12 rounded-full shadow-lg border-2 border-white flex items-center justify-center"
               style={{ 
                 background: i === 1 ? 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' : 
                             i === 2 ? 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' :
                                       'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
               }}
             >
               {i === 2 && <motion.div layoutId="cursor" className="w-3 h-3 bg-white rounded-full shadow-md" />}
             </motion.div>
           ))}
        </div>
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.8 }}
           className="text-xs font-medium text-muted flex items-center gap-2"
        >
          <Palette size={14} className="animate-pulse text-purple-500" />
          <span>INJECTING_PALETTE...</span>
        </motion.div>
      </div>
    </div>
  );
}

// ── Phase 3: Neural Processing
function SkeletonProcessingPhase() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/5">
      {/* Central Core */}
      <div className="relative">
        {/* Orbital Rings */}
        <motion.div
          className="absolute inset-0 rounded-full border border-primary/30 border-dashed"
          style={{ width: '120px', height: '120px', left: '-36px', top: '-36px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-accent/30"
          style={{ width: '90px', height: '90px', left: '-21px', top: '-21px' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Core Pulsing */}
        <motion.div
          className="w-12 h-12 bg-gradient-to-tr from-primary to-accent rounded-full flex items-center justify-center shadow-lg shadow-primary/30 z-10 relative"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain className="text-white w-6 h-6" />
        </motion.div>

        {/* Scanning Line Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none overflow-hidden rounded-full opacity-20">
             <motion.div 
               className="w-full h-1 bg-primary shadow-[0_0_15px_rgba(0,0,0,0.5)]"
               animate={{ top: ['0%', '100%'] }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               style={{ position: 'absolute', boxShadow: '0 0 10px var(--primary)' }}
             />
        </div>
      </div>
    </div>
  );
}

function PosterSkeleton({ index, lowMotion }: { index: number; lowMotion: boolean }) {
  const [phase, setPhase] = useState(0);
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    if (lowMotion) return;

    let phaseInterval: number | undefined;
    const delayStart = window.setTimeout(() => {
      phaseInterval = window.setInterval(() => {
        setPhase((prev) => (prev + 1) % 3);
      }, 3000);
    }, index * 800);

    return () => {
      window.clearTimeout(delayStart);
      if (phaseInterval) {
        window.clearInterval(phaseInterval);
      }
    };
  }, [index, lowMotion]);

  useEffect(() => {
    if (lowMotion) return;

    const interval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % LOADING_LOGS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [lowMotion]);

  if (lowMotion) {
    return (
      <div className="relative rounded-3xl overflow-hidden w-full h-full bg-surface-1 border border-card-border shadow-lg">
        <div className="h-8 bg-surface-2 border-b border-card-border flex items-center px-3 justify-between">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400/50" />
            <div className="w-2 h-2 rounded-full bg-amber-400/50" />
            <div className="w-2 h-2 rounded-full bg-green-400/50" />
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">PROCESSING_NODE_{index + 1}</div>
        </div>
        <div className="aspect-square bg-surface-2 p-6">
          <div className="h-full w-full border-2 border-dashed border-primary/30 rounded-2xl" />
        </div>
        <div className="p-3 bg-slate-900 border-t border-slate-800">
          <div className="font-mono text-xs text-green-400/80 truncate">
            <span className="mr-2 text-green-600">$</span>
            {LOADING_LOGS[0]}
          </div>
          <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-primary w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative rounded-3xl overflow-hidden w-full h-full bg-surface-1 border border-card-border shadow-xl"
    >
      {/* Top Status Bar */}
      <div className="h-8 bg-surface-2 border-b border-card-border flex items-center px-3 justify-between">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400/50" />
          <div className="w-2 h-2 rounded-full bg-amber-400/50" />
          <div className="w-2 h-2 rounded-full bg-green-400/50" />
        </div>
        <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          PROCESSING_NODE_{index + 1}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative aspect-square bg-surface-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === 0 && (
            <motion.div
              key="layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <SkeletonLayoutPhase />
            </motion.div>
          )}
          {phase === 1 && (
            <motion.div
              key="color"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <SkeletonColorPhase />
            </motion.div>
          )}
          {phase === 2 && (
            <motion.div
              key="process"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <SkeletonProcessingPhase />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Terminal Footer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="font-mono text-xs text-green-400/80 truncate">
          <span className="mr-2 text-green-600">$</span>
          {LOADING_LOGS[logIndex]}
          <span className="animate-blink inline-block w-1.5 h-3 ml-1 bg-green-400 align-middle" />
        </div>
        <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-green-500 to-primary"
            animate={{ width: ["0%", "100%"] }}
            transition={{ duration: 3, ease: "linear", repeat: Infinity }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── 3D Hover Effect Wrapper ──────────────────────────────────────

function Card3DHover({
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

// ── Main Component ────────────────────────────────────────────────

export function PosterGrid({
  results,
  genStep,
  error,
  totalExpected = 1,
  onSaveAsTemplate,
  onGenerateMore,
  onReset,
  canGenerateMore = true,
  generateMoreLabel,
}: PosterGridProps) {
  const { t, locale } = useLocale();
  const [selectedResult, setSelectedResult] = useState<PosterResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const lowMotionMode = useReducedMotion() ?? false;

  const successResults = results.filter((r) => r.status === "complete");
  const displayCount = Math.max(totalExpected, results.length);
  const isLoading = genStep === "generating-designs";

  // Define grid items based on displayCount
  const gridItems = Array.from({ length: displayCount }, (_, i) => i);

  const handleExportAll = useCallback(async () => {
    if (successResults.length === 0) return;
    setExportingAll(true);
    try {
      for (const res of successResults) {
        if (!res.imageBase64) continue;
        const link = document.createElement("a");
        link.href = res.imageBase64;
        link.download = `poster-${res.designIndex + 1}.png`;
        link.click();
        // Small delay to avoid browser blocking multiple downloads
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } finally {
      setExportingAll(false);
    }
  }, [successResults]);

  const handleCardClick = useCallback((result: PosterResult) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  }, []);

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
          <div className="py-12 md:py-20 animate-in fade-in duration-700">
              <LoadingSlideshow />
          </div>
      );
  }

  return (
      <div className="space-y-8">
      
      {genStep === "complete" && (
        <motion.div 
          initial={{ opacity: 0, y: -5, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-5 bg-surface-1 border border-success/30 shadow-sm rounded-2xl relative overflow-hidden ${
            displayCount === 1 ? "max-w-3xl mx-auto w-full" : ""
          }`}
        >
          {/* Subtle indicator bar */}
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-success/40" />
          
          <div className="flex items-center gap-3.5 flex-1">
            <div className="w-11 h-11 bg-success/10 text-success rounded-xl flex items-center justify-center shrink-0 ring-1 ring-success/20" title={t("نجاح", "Success")}>
              <CheckCircle2 size={22} className="animate-in zoom-in-50 duration-500" />
            </div>
            <div className="text-start">
              <h3 className="text-lg font-bold text-foreground leading-snug">
                {t("تم اكتمال التصميم بنجاح!", "Design completed successfully!")}
              </h3>
              <p className="text-muted text-xs font-medium opacity-80 mt-0.5">
                {t("جاهز للتحميل والمشاركة مع المحتوى التسويقي.", "Ready for download and sharing with marketing content.")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-card-border/40">
             {/* Primary Actions */}
             <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <button
                  onClick={() => document.getElementById('marketing-content')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-surface-2 hover:bg-surface-3 border border-card-border text-foreground rounded-xl transition-colors font-bold text-sm"
                  title={t("عرض المحتوى التسويقي المُقترح", "Show suggested marketing content")}
                >
                  {t("المحتوى التسويقي", "Marketing Content")}
                </button>
                <button
                  onClick={handleExportAll}
                  disabled={exportingAll}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm shadow-primary/20 transition-all font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 min-w-[100px]"
                  title={t("تحميل جميع التصاميم", "Download all designs")}
                >
                  {exportingAll ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                  <span>{t("تصدير", "Export")}</span>
                </button>
             </div>
          </div>
        </motion.div>
      )}

      {genStep === "error" && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
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

      {/* Grid Layout */}
      {(results.length > 0 || isLoading) && (
        <motion.div
          variants={lowMotionMode ? undefined : containerVariants}
          initial={lowMotionMode ? false : "hidden"}
          animate={lowMotionMode ? undefined : "show"}
          className={`grid gap-6 ${
            displayCount === 1 
              ? "max-w-2xl mx-auto grid-cols-1" 
              : displayCount === 2 
                ? "max-w-4xl mx-auto grid-cols-1 md:grid-cols-2" 
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {gridItems.map((index) => {
            const result = results.find((r) => r.designIndex === index);
            if (result) {
              return (
                <div key={result.designIndex} className="w-full flex flex-col md:flex-row gap-4 items-start relative group">
                  <div className="flex-1 w-full">
                    <PosterCard
                      result={result}
                      onSaveAsTemplate={onSaveAsTemplate}
                      lowMotion={lowMotionMode}
                      onClick={() => handleCardClick(result)}
                    />
                  </div>

                  {/* Vertical Action Buttons beside the image */}
                  {genStep === "complete" && (
                    <div className="flex flex-col gap-2.5 w-full md:w-48 shrink-0 md:sticky top-4">
                      {onGenerateMore && (
                        <button
                          onClick={onGenerateMore}
                          disabled={!canGenerateMore}
                          className="w-full flex items-center justify-center md:justify-start gap-2.5 px-4 py-3 bg-surface-1 border border-card-border hover:bg-primary/5 hover:border-primary/30 hover:text-primary text-muted-foreground font-medium text-sm rounded-2xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                        >
                          <Sparkles size={18} className="shrink-0 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-start leading-tight">{generateMoreLabel || t("إنشاء صورة إضافية", "Create another image")}</span>
                        </button>
                      )}
                      
                      {onReset && (
                        <button
                          onClick={onReset}
                          className="w-full flex items-center justify-center md:justify-start gap-2.5 px-4 py-3 bg-surface-1 border border-card-border hover:bg-surface-2 hover:border-foreground/30 hover:text-foreground text-muted-foreground font-medium text-sm rounded-2xl transition-all shadow-sm group/btn"
                        >
                          <LayoutGrid size={18} className="shrink-0 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-start leading-tight">{t("تصميم آخر", "Another design")}</span>
                        </button>
                      )}
                    </div>
                  )}
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

      {/* Full Screen Modal */}
      <PosterModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedResult(null);
        }}
        result={selectedResult}
        onSaveAsTemplate={onSaveAsTemplate}
      />
    </div>
  );
}

// ── Export Helper ─────────────────────────────────────────────────

async function exportPoster(result: PosterResult): Promise<void> {
  if (!result.imageBase64) return;
  
  // Convert base64 to Blob without fetch
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
  link.download = `poster-${result.designNameAr || result.designIndex + 1}-${
    result.format
  }.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Poster Card ───────────────────────────────────────────────────

function PosterCard({
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
    <Card3DHover
      className="w-full h-full"
      disabled={lowMotion}
    >
      <motion.div
        initial={
          lowMotion
            ? false
            : { opacity: 0, y: 40, scale: 0.9 }
        }
        animate={lowMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={
          lowMotion
            ? undefined
            : { type: "spring" as const, damping: 15, stiffness: 100 }
        }
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
            {/* Reel generation button temporarily disabled */}
            {/* {onTurnIntoReel && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onTurnIntoReel(result); }}
                className="p-2 rounded-lg text-muted hover:text-purple-500 hover:bg-purple-500/10 transition-colors"
                title={t("تحويل إلى ريلز", "Turn into Reel")}
              >
                <Film size={18} />
              </button>
            )} */}
            {onSaveAsTemplate && (
              <button
                type="button"
                onClick={handleSave}
                className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                title={t("حفظ كقالب", "Save as template")}
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
