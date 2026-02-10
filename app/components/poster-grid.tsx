"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import {
  Download,
  Share2,
  Loader2,
  CheckCircle2,
  XCircle,
  Save,
  DownloadCloud,
  Sparkles,
  Crown,
  LayoutGrid,
  Palette,
  Wand2,
  Brain,
} from "lucide-react";
import type { PosterResult, PosterGenStep } from "@/lib/types";

// ── Props ─────────────────────────────────────────────────────────

interface PosterGridProps {
  results: PosterResult[];
  genStep: PosterGenStep;
  error?: string;
  totalExpected?: number;
  onSaveAsTemplate?: (designIndex: number) => void;
}

// ── AI State Indicator (Typing Effect) ─────────────────────────────

const AI_MESSAGES = [
  "جاري تحليل بيانات مشروعك...",
  "الذكاء الاصطناعي يختار أفضل الألوان...",
  "تنسيق العناصر بشكل احترافي...",
  "إضافة لمسات إبداعية...",
  "مراجعة جودة التصاميم...",
];

function AiStateIndicator() {
  const [text, setText] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [delta, setDelta] = useState(100);

  useEffect(() => {
    const ticker = setInterval(() => {
      tick();
    }, delta);

    return () => clearInterval(ticker);
  });

  const tick = () => {
    const i = messageIndex % AI_MESSAGES.length;
    const fullText = AI_MESSAGES[i];
    const updatedText = isDeleting
      ? fullText.substring(0, text.length - 1)
      : fullText.substring(0, text.length + 1);

    setText(updatedText);

    if (isDeleting) {
      setDelta((prev) => prev / 2);
    }

    if (!isDeleting && updatedText === fullText) {
      setIsDeleting(true);
      setDelta(2000);
    } else if (isDeleting && updatedText === "") {
      setIsDeleting(false);
      setMessageIndex((prev) => prev + 1);
      setDelta(100);
    } else {
      if (!isDeleting && delta === 2000) setDelta(100);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-6">
      <motion.div
        className="relative"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur opacity-30" />
        <div className="relative bg-white rounded-full p-4 ring-1 ring-slate-200 shadow-sm">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </motion.div>

      <div className="h-8 flex items-center">
        <p className="text-lg md:text-xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          {text}
          <span className="w-0.5 h-6 mr-1 bg-primary inline-block animate-blink align-middle" />
        </p>
      </div>
    </div>
  );
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
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.2, type: "spring", duration: 1.5, bounce: 0 },
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
           className="text-xs font-medium text-slate-500 flex items-center gap-2"
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
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5">
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

function PosterSkeleton({ index, tier }: { index: number; tier: "premium" | "standard" }) {
  const [phase, setPhase] = useState(0);
  const [logIndex, setLogIndex] = useState(0);

  // Cycle phases
  useEffect(() => {
    const delayStart = setTimeout(() => {
        const interval = setInterval(() => {
          setPhase((prev) => (prev + 1) % 3);
        }, 3000); // 3 seconds per phase
        return () => clearInterval(interval);
    }, index * 800); // Stagger start time
    
    return () => clearTimeout(delayStart);
  }, [index]);

  // Cycle logs rapidly
  useEffect(() => {
    const interval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % LOADING_LOGS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative rounded-3xl overflow-hidden w-full h-full bg-white border border-slate-200 shadow-xl"
    >
      {/* Top Status Bar */}
      <div className="h-8 bg-slate-50 border-b border-slate-100 flex items-center px-3 justify-between">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400/50" />
          <div className="w-2 h-2 rounded-full bg-amber-400/50" />
          <div className="w-2 h-2 rounded-full bg-green-400/50" />
        </div>
        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          PROCESSING_NODE_{index + 1}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative aspect-square bg-white overflow-hidden">
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8]);

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
  totalExpected = results.length || 3,
  onSaveAsTemplate,
}: PosterGridProps) {
  const isLoading = genStep === "generating-designs";
  const [exportingAll, setExportingAll] = useState(false);

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

  // Create grid items for all expected indices
  const gridItems = Array.from({ length: totalExpected }, (_, i) => ({
    index: i,
    tier: (i === 0 ? "premium" : "standard") as "premium" | "standard",
  }));

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  return (
    <div className="space-y-8">
      {/* AI Status Indicator */}
      {isLoading && <AiStateIndicator />}

      {genStep === "complete" && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 px-6 bg-success/5 border border-success/20 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-full">
              <CheckCircle2 size={24} className="text-success" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                تم اكتمال التصميم!
              </h3>
              <p className="text-muted text-sm">
                تم إنشاء {successResults.length} من {totalExpected} تصاميم بنجاح
              </p>
            </div>
          </div>

          {successResults.length > 0 && (
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
              تصدير جميع التصاميم
            </button>
          )}
        </div>
      )}

      {genStep === "error" && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-4 bg-danger/10 rounded-full">
            <XCircle size={40} className="text-danger" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">عذراً، حدث خطأ</h3>
          {error && (
            <p className="max-w-md mx-auto text-muted bg-danger/5 border border-danger/10 rounded-lg p-3 text-sm">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Results Grid - Grid layout with 3 columns */}
      {(results.length > 0 || isLoading) && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        >
          {gridItems.map(({ index, tier }) => {
            const result = results.find((r) => r.designIndex === index);
            if (result) {
              return (
                <div key={result.designIndex} className="w-full">
                  <PosterCard
                    result={result}
                    onSaveAsTemplate={onSaveAsTemplate}
                  />
                </div>
              );
            }

            if (isLoading) {
              return (
                <div key={`skeleton-${index}`} className="w-full">
                  <PosterSkeleton
                    index={index}
                    tier={tier}
                  />
                </div>
              );
            }
            return null;
          })}
        </motion.div>
      )}
    </div>
  );
}

// ── Export Helper ─────────────────────────────────────────────────

async function exportPoster(result: PosterResult): Promise<void> {
  if (!result.imageBase64) return;
  const res = await fetch(result.imageBase64);
  const blob = await res.blob();
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
}: {
  result: PosterResult;
  onSaveAsTemplate?: (designIndex: number) => void;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const isPremium = result.tier === "premium";

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportPoster(result);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [result]);

  const handleShare = async () => {
    if (!("share" in navigator)) return;
    try {
      if (!result.imageBase64) return;
      const res = await fetch(result.imageBase64);
      const blob = await res.blob();
      const file = new File([blob], `poster-${result.format}.png`, {
        type: "image/png",
      });
      await navigator.share({ files: [file] });
    } catch {
      // User cancelled or share failed
    }
  };

  if (result.status === "error") {
    return (
      <div className="bg-card border border-danger/30 rounded-2xl overflow-hidden shadow-md w-full">
        <div className="aspect-square bg-danger/5 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <XCircle size={32} className="text-danger" />
          <p className="text-sm text-danger font-medium">فشل التصميم</p>
          {result.error && <p className="text-xs text-muted">{result.error}</p>}
        </div>
        <div className="p-3 text-center">
          <span className="text-xs text-muted">
            تصميم {result.designIndex + 1}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Card3DHover
      className={`${isPremium ? "md:scale-110 md:-mt-4 z-10" : ""} w-full`}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: isPremium ? 50 : 40,
          scale: isPremium ? 0.85 : 0.9,
          filter: isPremium ? "blur(15px)" : "blur(10px)",
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
        }}
        transition={
          isPremium
            ? { type: "spring" as const, damping: 12, stiffness: 80, delay: 0.1 }
            : { type: "spring" as const, damping: 15, stiffness: 100 }
        }
        className={`rounded-3xl overflow-hidden transition-shadow ${
          isPremium
            ? "border-2 border-amber-400/50 shadow-2xl shadow-amber-500/20 bg-gradient-to-b from-amber-50 to-white"
            : "border border-slate-200 shadow-lg bg-white"
        }`}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          {result.imageBase64 && (
            <img
              src={result.imageBase64}
              alt={result.designNameAr || `تصميم ${result.designIndex + 1}`}
              className="w-full h-full object-cover"
            />
          )}

          {/* Premium badge */}
          {isPremium && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-xs font-bold shadow-lg shadow-amber-500/30"
            >
              <Crown size={12} />
              Premium
            </motion.div>
          )}

          {/* Standard badge */}
          {!isPremium && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-bold">
              <Sparkles size={12} />
              AI
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all duration-200 z-[5]" />
        </div>

        {/* Footer */}
        <div className="p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground/80 truncate max-w-[50%]">
            {result.designNameAr || `تصميم ${result.designIndex + 1}`}
          </span>
          <div className="flex items-center gap-1.5">
            {onSaveAsTemplate && (
              <button
                type="button"
                onClick={() => onSaveAsTemplate(result.designIndex)}
                className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                title="حفظ كقالب"
              >
                <Save size={16} />
              </button>
            )}
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                title="مشاركة"
              >
                <Share2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="p-2 rounded-lg text-muted hover:text-success hover:bg-success/10 transition-colors"
              title="تصدير PNG"
            >
              {isExporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </Card3DHover>
  );
}
