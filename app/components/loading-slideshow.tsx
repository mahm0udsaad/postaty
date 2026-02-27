"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Palette,
  Type,
  ImageIcon,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";

// ── Slide Data ─────────────────────────────────────────────────────

interface Slide {
  icon: LucideIcon;
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  gradient: string;
  accentColor: string;
}

const SLIDES: Slide[] = [
  {
    icon: Wand2,
    title: { ar: "تحليل سياق العرض", en: "Analyzing Offer Context" },
    subtitle: { ar: "نستخلص جوهر منتجك ونحلل تفاصيل العرض بدقة ذكاء اصطناعي", en: "Extracting your product's essence and analyzing offer details with AI precision" },
    gradient: "from-violet-600/20 to-indigo-600/20",
    accentColor: "rgb(139 92 246)",
  },
  {
    icon: Palette,
    title: { ar: "هندسة الهوية البصرية", en: "Engineering Visual Identity" },
    subtitle: { ar: "نبتكر لوحة ألوان متناغمة تعزز حضور علامتك التجارية", en: "Creating a harmonious color palette that elevates your brand presence" },
    gradient: "from-pink-600/20 to-rose-600/20",
    accentColor: "rgb(236 72 153)",
  },
  {
    icon: Type,
    title: { ar: "صياغة النصوص التسويقية", en: "Crafting Persuasive Copy" },
    subtitle: { ar: "نحول المميزات إلى نصوص إبداعية تلامس تطلعات عملائك", en: "Turning features into creative copy that resonates with your customers" },
    gradient: "from-amber-600/20 to-orange-600/20",
    accentColor: "rgb(245 158 11)",
  },
  {
    icon: ImageIcon,
    title: { ar: "معالجة بصرية فائقة", en: "Ultra Visual Processing" },
    subtitle: { ar: "تحسين احترافي للصور لضمان أعلى درجات الجاذبية والوضوح", en: "Professional image enhancement to ensure maximum clarity and appeal" },
    gradient: "from-emerald-600/20 to-teal-600/20",
    accentColor: "rgb(16 185 129)",
  },
  {
    icon: LayoutGrid,
    title: { ar: "بناء الهيكل التصميمي", en: "Architecting Design Layout" },
    subtitle: { ar: "توزيع العناصر بنسب ذهبية لتحقيق توازن بصري مثالي", en: "Distributing elements using golden ratios for perfect visual balance" },
    gradient: "from-blue-600/20 to-cyan-600/20",
    accentColor: "rgb(59 130 246)",
  },
  {
    icon: Sparkles,
    title: { ar: "اللمسات الإبداعية الأخيرة", en: "Final Creative Polish" },
    subtitle: { ar: "إضافة التأثيرات السحرية والتحسينات النهائية للتصميم", en: "Adding magical effects and final refinements to your design" },
    gradient: "from-fuchsia-600/20 to-purple-600/20",
    accentColor: "rgb(217 70 239)",
  },
];

// ── Animated Backgrounds per Slide ─────────────────────────────────

function SlideAnimation({ index, accentColor }: { index: number; accentColor: string }) {
  switch (index) {
    case 0:
      return <WandAnimation color={accentColor} />;
    case 1:
      return <PaletteAnimation />;
    case 2:
      return <TypewriterAnimation color={accentColor} />;
    case 3:
      return <ImageScanAnimation color={accentColor} />;
    case 4:
      return <LayoutAnimation color={accentColor} />;
    case 5:
      return <SparkleAnimation />;
    default:
      return null;
  }
}

// Slide 0: Converging particles
function WandAnimation({ color }: { color: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i * 30 * Math.PI) / 180,
        delay: i * 0.08,
        size: 4 + Math.random() * 4,
      })),
    []
  );

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: color,
            opacity: 0.6,
          }}
          initial={{
            x: Math.cos(p.angle) * 80,
            y: Math.sin(p.angle) * 80,
            scale: 0,
          }}
          animate={{
            x: [Math.cos(p.angle) * 80, 0],
            y: [Math.sin(p.angle) * 80, 0],
            scale: [0, 1.2, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 2,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: 0.5,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Center glow */}
      <motion.div
        className="absolute w-8 h-8 rounded-full"
        style={{ backgroundColor: color, filter: "blur(8px)" }}
        animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

// Slide 1: Expanding color drops
function PaletteAnimation() {
  const colors = ["#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];

  return (
    <div className="absolute inset-0 flex items-center justify-center gap-3">
      {colors.map((color, i) => (
        <motion.div
          key={color}
          className="rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{
            width: [0, 28, 24],
            height: [0, 28, 24],
            opacity: [0, 1, 0.9],
          }}
          transition={{
            duration: 0.6,
            delay: i * 0.15,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        />
      ))}
    </div>
  );
}

// Slide 2: Typewriter dots
function TypewriterAnimation({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex gap-2 dir-rtl">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-6 rounded-sm"
            style={{ backgroundColor: color }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: [0, 1, 1, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeOut",
            }}
          />
        ))}
        <motion.div
          className="w-0.5 h-6 rounded-full bg-current"
          style={{ color }}
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      </div>
    </div>
  );
}

// Slide 3: Scanning line over grid
function ImageScanAnimation({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-20 h-20 rounded-xl border-2 border-card-border overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
            backgroundSize: "10px 10px",
          }}
        />
        {/* Scanning line */}
        <motion.div
          className="absolute left-0 right-0 h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            boxShadow: `0 0 12px ${color}`,
          }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
        {/* Corner brackets */}
        <div
          className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 rounded-tl-sm"
          style={{ borderColor: color }}
        />
        <div
          className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 rounded-tr-sm"
          style={{ borderColor: color }}
        />
        <div
          className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 rounded-bl-sm"
          style={{ borderColor: color }}
        />
        <div
          className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 rounded-br-sm"
          style={{ borderColor: color }}
        />
      </div>
    </div>
  );
}

// Slide 4: Blocks assembling
function LayoutAnimation({ color }: { color: string }) {
  const blocks = [
    { w: 28, h: 16, x: -18, y: -14, delay: 0 },
    { w: 16, h: 16, x: 14, y: -14, delay: 0.2 },
    { w: 44, h: 10, x: -2, y: 6, delay: 0.4 },
    { w: 20, h: 10, x: -12, y: 18, delay: 0.6 },
    { w: 20, h: 10, x: 12, y: 18, delay: 0.8 },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {blocks.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-md"
          style={{
            width: b.w,
            height: b.h,
            backgroundColor: color,
            opacity: 0.15 + i * 0.1,
          }}
          initial={{
            x: b.x + (Math.random() - 0.5) * 120,
            y: b.y + (Math.random() - 0.5) * 120,
            rotate: Math.random() * 180 - 90,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            x: b.x,
            y: b.y,
            rotate: 0,
            scale: 1,
            opacity: 0.15 + i * 0.1,
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 12,
            delay: b.delay,
          }}
        />
      ))}
    </div>
  );
}

// Slide 5: Sparkles burst
function SparkleAnimation() {
  const sparkles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 60,
        size: 3 + Math.random() * 5,
        delay: Math.random() * 2,
        color: ["#f59e0b", "#8b5cf6", "#ec4899", "#3b82f6", "#10b981"][i % 5],
      })),
    []
  );

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{ x: s.x, y: s.y }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180],
          }}
          transition={{
            duration: 1.5,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
        >
          <svg
            width={s.size * 2}
            height={s.size * 2}
            viewBox="0 0 24 24"
            fill={s.color}
          >
            <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41Z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// ── Status Logs (Simulated high-tech process) ──────────────────────

const STATUS_LOGS = [
  ">> INIT_CREATIVE_ENGINE [OK]",
  ">> ANALYZING_BRAND_CONTEXT...",
  ">> VECTORIZING_ASSETS [72%]",
  ">> OPTIMIZING_LAYOUT_RATIOS...",
  ">> SAMPLING_COLOR_HARMONY...",
  ">> RENDERING_LAYER_STACK...",
  ">> APPLYING_AI_POLISH...",
  ">> EXPORTING_BUFFER...",
];

function StatusLog() {
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % STATUS_LOGS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 font-mono text-[10px] text-green-400/90 shadow-inner">
      <span className="animate-pulse">●</span>
      <span className="truncate">{STATUS_LOGS[logIndex]}</span>
    </div>
  );
}

// ── Progress Ring ──────────────────────────────────────────────────

function ProgressRing({
  progress,
  accentColor,
}: {
  progress: number;
  accentColor: string;
}) {
  const circumference = 2 * Math.PI * 18;

  return (
    <svg width="48" height="48" className="rotate-[-90deg]">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        className="text-white/10"
      />
      <motion.circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke={accentColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: circumference * (1 - progress) }}
        transition={{ duration: 1, ease: "circOut" }}
        filter="url(#glow)"
      />
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────

export function LoadingSlideshow() {
  const { t, locale } = useLocale();
  const [activeSlide, setActiveSlide] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const SLIDE_DURATION = 4000; // Slightly longer for better readability

  // Advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, []);

  // Track elapsed time
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[activeSlide];
  const overallProgress = Math.min((activeSlide + 1) / SLIDES.length, 1);

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <div className="relative group">
        {/* Outer Glow Decoration */}
        <motion.div 
          className="absolute -inset-1 rounded-[2.5rem] opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-1000"
          style={{ backgroundColor: slide.accentColor }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <div className="relative glass-card rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-surface-1/90 backdrop-blur-2xl">
          {/* Header Area */}
          <div className="px-8 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <div className="relative flex-shrink-0">
                <ProgressRing
                  progress={overallProgress}
                  accentColor={slide.accentColor}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-foreground">
                  {Math.round(overallProgress * 100)}%
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {t("جاري الابتكار...", "Innovating...")}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  <span className="text-xs font-medium tabular-nums">
                    {elapsed} {t("ثانية", "sec")}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-xs font-bold text-primary/80 uppercase tracking-widest">
                    STEP {activeSlide + 1}/{SLIDES.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-48">
               <StatusLog />
            </div>
          </div>

          {/* Visual Canvas Area */}
          <div className="relative h-64 overflow-hidden mt-2 mx-6 rounded-2xl bg-black/20 border border-white/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Immersive Background Detail */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)]" />
                <div className="absolute inset-0 opacity-[0.03] bg-grid-pattern" />

                {/* Animated Illustration */}
                <SlideAnimation
                  index={activeSlide}
                  accentColor="rgba(255,255,255,0.9)"
                />

                {/* Main Action Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.3,
                    }}
                    className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                  >
                    <slide.icon className="w-10 h-10 text-white" style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }} />
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Text Content Area */}
          <div className="px-8 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center space-y-3"
              >
                <h3 
                  className="text-2xl font-black tracking-tight"
                  style={{ color: slide.accentColor }}
                >
                  {t(slide.title.ar, slide.title.en)}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto font-medium">
                  {t(slide.subtitle.ar, slide.subtitle.en)}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Master Progress Segment Bar */}
          <div className="flex h-1.5 w-full bg-black/30">
            {SLIDES.map((_, i) => (
              <div key={i} className="flex-1 relative overflow-hidden border-r border-black/10 last:border-0">
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={{
                    backgroundColor: i === activeSlide ? slide.accentColor : i < activeSlide ? slide.accentColor : "transparent",
                    opacity: i === activeSlide ? 1 : i < activeSlide ? 0.6 : 0,
                    x: i === activeSlide ? ["-100%", "0%"] : "0%"
                  }}
                  transition={{
                    backgroundColor: { duration: 0.5 },
                    opacity: { duration: 0.5 },
                    x: { duration: SLIDE_DURATION / 1000, ease: "linear" }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Floating Pro Tip / Engagement */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center"
        >
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <Sparkles size={12} className="text-primary/40" />
            <span>AI Design Engine v4.28.0</span>
            <Sparkles size={12} className="text-primary/40" />
          </p>
        </motion.div>
      </div>
    </div>
  );
}

