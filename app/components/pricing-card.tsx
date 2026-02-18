"use client";

import { Check } from "lucide-react";
import { formatPrice } from "@/lib/country-pricing";

type PlanKey = "starter" | "growth" | "dominant";

const PLAN_FEATURES: Record<PlanKey, string[]> = {
  starter: [
    "10 تصاميم ذكية شهرياً",
    "1–2 محتوى أسبوعياً",
    "حجم تصدير واحد",
    "نصوص تسويقية أساسية",
    "تنزيل HD",
    "معرض بسيط",
  ],
  growth: [
    "25 تصميماً ذكياً شهرياً",
    "3–4 محتوى أسبوعياً",
    "3 أحجام تصدير (بوست، ستوري، واتس)",
    "نصوص تسويقية قوية",
    "الهوية التجارية محفوظة",
    "تنزيل حزمة كاملة",
    "معرض منظم",
  ],
  dominant: [
    "50 تصميماً ذكياً شهرياً",
    "محتوى يومي تقريباً",
    "توليد موجه بالأهداف",
    "عبارات تحويل ذكية",
    "جميع الأحجام مُصَدَّرة تلقائياً",
    "أرشيف متقدم",
    "توليد بأولوية",
    "مرشحات محتوى ذكية",
  ],
};

const PLAN_LABELS: Record<PlanKey, string> = {
  starter: "مبتدي",
  growth: "نمو",
  dominant: "هيمنة",
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
  currencySymbol: string;
  isPopular?: boolean;
  ctaButton: React.ReactNode;
};

export function PricingCard({
  planKey,
  monthlyPrice,
  firstMonthPrice,
  currencySymbol,
  isPopular,
  ctaButton,
}: PricingCardProps) {
  const features = PLAN_FEATURES[planKey];
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
          الأكثر شعبية
        </div>
      )}
      <div
        className={`text-sm font-bold mb-2 ${
          isPopular ? "text-primary" : "text-muted"
        }`}
      >
        {PLAN_LABELS[planKey]}
      </div>
      <div className="text-4xl font-black mb-1">
        {formatPrice(monthlyPrice, currencySymbol)}{" "}
        <span className="text-lg text-muted font-medium">/شهر</span>
      </div>
      <p className="text-muted text-sm mb-1">
        الشهر الأول: {formatPrice(firstMonthPrice, currencySymbol)}
      </p>
      <p className="text-muted text-xs mb-6 opacity-75">
        ثم {formatPrice(monthlyPrice, currencySymbol)} شهرياً
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
