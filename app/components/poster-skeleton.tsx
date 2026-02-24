"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { Palette, Brain } from "lucide-react";

// ── Loading Logs ─────────────────────────────────────────────────

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

// ── Phase 1: Wireframe / Blueprint Construction ──────────────────

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
      <div className="absolute inset-0 opacity-[0.03]"
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      />
      <motion.svg className="w-full h-full stroke-primary/40 stroke-[2] fill-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.rect x="0" y="0" width="100" height="60" rx="5" variants={draw} custom={0} initial="hidden" animate="visible" />
        <motion.line x1="10" y1="70" x2="60" y2="70" variants={draw} custom={1} initial="hidden" animate="visible" />
        <motion.line x1="10" y1="80" x2="40" y2="80" variants={draw} custom={2} initial="hidden" animate="visible" />
        <motion.circle cx="85" cy="75" r="10" variants={draw} custom={3} initial="hidden" animate="visible" />
        <motion.rect x="65" y="90" width="35" height="10" rx="2" variants={draw} custom={4} initial="hidden" animate="visible" />
      </motion.svg>
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

// ── Phase 2: Color Injection ─────────────────────────────────────

function SkeletonColorPhase() {
  return (
    <div className="absolute inset-0 overflow-hidden">
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

// ── Phase 3: Neural Processing ───────────────────────────────────

function SkeletonProcessingPhase() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/5">
      <div className="relative">
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
        <motion.div
          className="w-12 h-12 bg-gradient-to-tr from-primary to-accent rounded-full flex items-center justify-center shadow-lg shadow-primary/30 z-10 relative"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain className="text-white w-6 h-6" />
        </motion.div>
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

// ── Main Skeleton Component ──────────────────────────────────────

export function PosterSkeleton({ index, lowMotion }: { index: number; lowMotion: boolean }) {
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
      if (phaseInterval) window.clearInterval(phaseInterval);
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

      <div className="relative aspect-square bg-surface-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === 0 && (
            <motion.div key="layout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0">
              <SkeletonLayoutPhase />
            </motion.div>
          )}
          {phase === 1 && (
            <motion.div key="color" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0">
              <SkeletonColorPhase />
            </motion.div>
          )}
          {phase === 2 && (
            <motion.div key="process" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0">
              <SkeletonProcessingPhase />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
