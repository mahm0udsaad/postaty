"use client";

import { Check } from "lucide-react";
import { formatPrice } from "@/lib/country-pricing";
import type { AppLocale } from "@/lib/i18n";

type PlanKey = "starter" | "growth" | "dominant";

const PLAN_FEATURES: Record<PlanKey, { ar: string[]; en: string[] }> = {
  starter: {
    ar: [
      "10 تصاميم ذكية شهرياً",
      "1–2 محتوى أسبوعياً",
      "حجم تصدير واحد",
      "نصوص تسويقية أساسية",
      "تنزيل HD",
      "معرض بسيط",
    ],
    en: [
      "10 AI designs/month",
      "1-2 weekly content pieces",
      "One export size",
      "Basic marketing copy",
      "HD download",
      "Simple gallery",
    ],
  },
  growth: {
    ar: [
      "25 تصميماً ذكياً شهرياً",
      "3–4 محتوى أسبوعياً",
      "3 أحجام تصدير (بوست، ستوري، واتس)",
      "نصوص تسويقية قوية",
      "الهوية التجارية محفوظة",
      "تنزيل حزمة كاملة",
      "معرض منظم",
    ],
    en: [
      "25 AI designs/month",
      "3-4 weekly content pieces",
      "3 export sizes (Post, Story, WhatsApp)",
      "High-converting marketing copy",
      "Saved brand identity",
      "Full pack download",
      "Organized gallery",
    ],
  },
  dominant: {
    ar: [
      "50 تصميماً ذكياً شهرياً",
      "محتوى يومي تقريباً",
      "توليد موجه بالأهداف",
      "عبارات تحويل ذكية",
      "جميع الأحجام مُصَدَّرة تلقائياً",
      "أرشيف متقدم",
      "توليد بأولوية",
      "مرشحات محتوى ذكية",
    ],
    en: [
      "50 AI designs/month",
      "Near-daily content",
      "Goal-based generation",
      "Smart conversion copy",
      "Automatic export for all sizes",
      "Advanced archive",
      "Priority generation",
      "Smart content filters",
    ],
  },
};

const PLAN_LABELS: Record<PlanKey, { ar: string; en: string }> = {
  starter: { ar: "أساسي", en: "Basic" },
  growth: { ar: "احترافي", en: "Pro" },
  dominant: { ar: "بريميوم", en: "Premium" },
};

const CHECK_COLORS: Record<PlanKey, string> = {
  starter: "text-success",
  growth: "text-primary",
  dominant: "text-accent",
};

export type PricingCardProps = {
  planKey: PlanKey;
  monthlyPrice: number;
  firstMonthPrice: number;
  isPopular?: boolean;
  locale: AppLocale;
  ctaButton: React.ReactNode;
};

export function PricingCard({
  planKey,
  monthlyPrice,
  firstMonthPrice,
  isPopular,
  locale,
  ctaButton,
}: PricingCardProps) {
  const features = PLAN_FEATURES[planKey][locale];
  const checkColor = CHECK_COLORS[planKey];

  return (
    <div
      className={`bg-surface-1 rounded-2xl p-8 relative ${
        isPopular
          ? "border-2 border-primary/30"
          : "border border-card-border"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 right-6 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
          {locale === "ar" ? "الأكثر شعبية" : "Most popular"}
        </div>
      )}
      <div
        className={`text-sm font-bold mb-2 ${
          isPopular ? "text-primary" : "text-muted"
        }`}
      >
        {PLAN_LABELS[planKey][locale]}
      </div>
      <div className="text-4xl font-black mb-1">
        {formatPrice(monthlyPrice)}{" "}
        <span className="text-lg text-muted font-medium">{locale === "ar" ? "/شهر" : "/month"}</span>
      </div>
      <p className="text-muted text-sm mb-1">
        {locale === "ar" ? "الشهر الأول" : "First month"}: {formatPrice(firstMonthPrice)}
      </p>
      <p className="text-muted text-xs mb-6 opacity-75">
        {locale === "ar" ? "ثم" : "Then"} {formatPrice(monthlyPrice)} {locale === "ar" ? "شهرياً" : "monthly"}
      </p>
      <ul className="space-y-3 mb-8">
        {features.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <Check size={14} className={checkColor} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {ctaButton}
    </div>
  );
}

export { PLAN_FEATURES, PLAN_LABELS, CHECK_COLORS };
