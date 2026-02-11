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

// ── Slide Data ─────────────────────────────────────────────────────

interface Slide {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  gradient: string;
  accentColor: string;
}

const SLIDES: Slide[] = [
  {
    icon: Wand2,
    title: "تحليل بيانات العرض",
    subtitle: "نقرأ تفاصيل منتجك ونفهم هوية علامتك التجارية",
    gradient: "from-violet-500 to-indigo-600",
    accentColor: "rgb(139 92 246)",
  },
  {
    icon: Palette,
    title: "اختيار الألوان والأنماط",
    subtitle: "نصمم لوحة ألوان متناسقة تعكس هوية علامتك",
    gradient: "from-pink-500 to-rose-600",
    accentColor: "rgb(236 72 153)",
  },
  {
    icon: Type,
    title: "صياغة النصوص الإبداعية",
    subtitle: "نكتب نصوص تسويقية مؤثرة تجذب عملاءك",
    gradient: "from-amber-500 to-orange-600",
    accentColor: "rgb(245 158 11)",
  },
  {
    icon: ImageIcon,
    title: "معالجة الصور بالذكاء الاصطناعي",
    subtitle: "نحسّن جودة صور المنتج ونضبط الإضاءة والتباين",
    gradient: "from-emerald-500 to-teal-600",
    accentColor: "rgb(16 185 129)",
  },
  {
    icon: LayoutGrid,
    title: "بناء التصميم النهائي",
    subtitle: "نرتب العناصر بشكل احترافي متوازن وجذاب",
    gradient: "from-blue-500 to-cyan-600",
    accentColor: "rgb(59 130 246)",
  },
  {
    icon: Sparkles,
    title: "إضافة اللمسات السحرية",
    subtitle: "نضيف التأثيرات البصرية المميزة واللمسات الأخيرة",
    gradient: "from-fuchsia-500 to-purple-600",
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
      <div className="relative w-20 h-20 rounded-xl border-2 border-slate-200 overflow-hidden">
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
    <svg width="44" height="44" className="rotate-[-90deg]">
      <circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-slate-100"
      />
      <motion.circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke={accentColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: circumference * (1 - progress) }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────

export function LoadingSlideshow() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const SLIDE_DURATION = 3500; // ms per slide

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
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ProgressRing
                progress={overallProgress}
                accentColor={slide.accentColor}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                {activeSlide + 1}/{SLIDES.length}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                جاري التصميم...
              </p>
              <p className="text-xs text-slate-400">
                {elapsed > 0 && `${elapsed} ثانية`}
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <motion.div
                key={i}
                className="h-1.5 rounded-full"
                animate={{
                  width: i === activeSlide ? 20 : 6,
                  backgroundColor:
                    i === activeSlide
                      ? slide.accentColor
                      : i < activeSlide
                        ? slide.accentColor
                        : "#e2e8f0",
                  opacity: i <= activeSlide ? 1 : 0.5,
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>

        {/* Slide Area */}
        <div className="relative h-56 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              {/* Background Pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Animated illustration */}
              <SlideAnimation
                index={activeSlide}
                accentColor="rgba(255,255,255,0.9)"
              />

              {/* Central icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg"
                >
                  <slide.icon className="w-8 h-8 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Text Content */}
        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="text-center space-y-2"
            >
              <h3 className="text-lg font-bold text-slate-900">
                {slide.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {slide.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom shimmer bar */}
        <div className="h-1 bg-slate-100 overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${slide.gradient}`}
            animate={{ x: ["-100%", "100%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ width: "60%" }}
          />
        </div>
      </div>
    </div>
  );
}
