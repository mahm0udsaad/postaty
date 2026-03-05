"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Palette,
  ImageIcon,
  Wand2,
  Type,
  LayoutGrid,
} from "lucide-react";
import type { GenerationResult } from "@/lib/types";
import { PosterPreview } from "./poster-preview";
import { useLocale } from "@/hooks/use-locale";

interface GenerationViewProps {
  step: "crafting-prompt" | "generating-images" | "complete" | "error";
  results: GenerationResult[];
  error?: string;
}

function SkeletonLoader() {
  const { t } = useLocale();
  const [activeStep, setActiveStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const generationSteps = useMemo(() => [
    { icon: Wand2, label: t("تحليل بيانات العرض", "Analyzing offer details"), sublabel: t("فهم تفاصيل المنتج والعرض", "Understanding product and offer details") },
    { icon: Palette, label: t("اختيار الألوان والتصميم", "Choosing colors and style"), sublabel: t("تصميم هوية بصرية جذابة", "Crafting an attractive visual identity") },
    { icon: Type, label: t("كتابة النصوص الإبداعية", "Writing creative copy"), sublabel: t("صياغة نص تسويقي مؤثر", "Composing persuasive marketing text") },
    { icon: ImageIcon, label: t("معالجة الصور", "Processing images"), sublabel: t("تحسين جودة صور المنتج", "Enhancing product image quality") },
    { icon: LayoutGrid, label: t("تنسيق البوستر", "Arranging poster layout"), sublabel: t("ترتيب العناصر بشكل احترافي", "Organizing elements professionally") },
    { icon: Sparkles, label: t("اللمسات النهائية", "Final touches"), sublabel: t("إضافة تأثيرات بصرية مميزة", "Adding standout visual effects") },
  ], [t]);
  const tips = useMemo(() => [
    t("البوسترات المصممة باحترافية تزيد التفاعل بنسبة 80%", "Professionally designed posters can increase engagement by up to 80%"),
    t("الألوان الدافئة تجذب انتباه المتسوقين أكثر", "Warm colors draw more shopper attention"),
    t("العروض المحدودة الوقت تحقق مبيعات أعلى بـ 3 أضعاف", "Limited-time offers can drive up to 3x higher sales"),
    t("صور المنتجات عالية الجودة تزيد الثقة لدى العملاء", "High-quality product images build customer trust"),
    t("إضافة السعر القديم مع الجديد يبرز قيمة العرض", "Showing old and new prices highlights offer value"),
  ], [t]);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % generationSteps.length);
    }, 3000);
    return () => clearInterval(stepInterval);
  }, [generationSteps.length]);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(tipInterval);
  }, [tips.length]);

  return (
    <div className="space-y-8">
      {/* Animated poster skeleton */}
      <div className="max-w-sm mx-auto">
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-lg">
          {/* Skeleton header */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-primary/10 rounded-lg w-3/4 animate-pulse" />
                <div className="h-3 bg-primary/5 rounded-lg w-1/2 animate-pulse" style={{ animationDelay: "150ms" }} />
              </div>
            </div>
          </div>

          {/* Skeleton image area */}
          <div className="relative mx-4">
            <div className="aspect-square bg-gradient-to-br from-primary/5 via-accent/10 to-success/5 rounded-xl animate-pulse overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              {/* Shimmer effect */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                  animation: "shimmer 2s infinite",
                }}
              />
            </div>
          </div>

          {/* Skeleton price area */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-8 bg-accent/20 rounded-xl w-24 animate-pulse" />
              <div className="h-5 bg-danger/10 rounded-lg w-16 animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
            <div className="h-12 bg-success/15 rounded-xl animate-pulse" style={{ animationDelay: "200ms" }} />
            <div className="flex gap-2">
              <div className="h-8 bg-primary/10 rounded-lg flex-1 animate-pulse" style={{ animationDelay: "100ms" }} />
              <div className="h-8 bg-success/10 rounded-lg w-20 animate-pulse" style={{ animationDelay: "250ms" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Step progress */}
      <div className="max-w-md mx-auto space-y-3">
        {generationSteps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === activeStep;
          const isDone = i < activeStep;

          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500
                ${isActive ? "bg-primary/10 border border-primary/30 scale-[1.02]" : ""}
                ${isDone ? "opacity-50" : ""}
                ${!isActive && !isDone ? "opacity-30" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-500
                  ${isActive ? "bg-primary text-white" : isDone ? "bg-success/20 text-success" : "bg-card-border/50 text-muted"}`}
              >
                {isDone ? (
                  <CheckCircle2 size={16} />
                ) : isActive ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Icon size={16} />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}>
                  {s.label}
                </p>
                {isActive && (
                  <p className="text-xs text-muted mt-0.5 animate-in fade-in duration-300">
                    {s.sublabel}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="text-center">
        <p className="text-sm text-muted transition-all duration-500" key={tipIndex}>
          <span className="text-accent">*</span> {tips[tipIndex]}
        </p>
      </div>
    </div>
  );
}

export function GenerationView({ step, results, error }: GenerationViewProps) {
  const { t } = useLocale();
  const isLoading = step === "crafting-prompt" || step === "generating-images";

  return (
    <div className="space-y-8">
      {isLoading && <SkeletonLoader />}

      {step === "complete" && (
        <div className="flex items-center justify-center gap-3 py-4">
          <CheckCircle2 size={24} className="text-success" />
          <span className="text-lg font-medium">{t("تم إنشاء البوسترات بنجاح!", "Posters were generated successfully!")}</span>
        </div>
      )}

      {step === "error" && (
        <>
          <div className="flex items-center justify-center gap-3 py-4">
            <XCircle size={24} className="text-danger" />
            <span className="text-lg font-medium">{t("حدث خطأ", "An error occurred")}</span>
          </div>
          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-center text-danger">
              {error}
            </div>
          )}
        </>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result) => (
            <PosterPreview key={result.format} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}
