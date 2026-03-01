"use client";

import { Check } from "lucide-react";
import { formatPrice } from "@/lib/country-pricing";
import type { AppLocale } from "@/lib/i18n";

type PlanKey = "starter" | "growth" | "dominant";

const PLAN_FEATURES: Record<PlanKey, { ar: string[]; en: string[] }> = {
  starter: {
    ar: [
      "15 تصميم ذكي شهرياً (جاهزين للنشر خلال دقائق)",
      "1–2 محتوى أسبوعياً مناسب لحسابك ونشاطك",
      "مقاس تصدير واحد حسب استخدامك الأساسي",
      "نصوص تسويقية أساسية جاهزة مع كل تصميم",
      "تحميل بجودة HD للنشر بثقة",
      "معرض بسيط لترتيب أعمالك والرجوع لها بسهولة",
    ],
    en: [
      "15 AI designs/month (Ready in minutes)",
      "1-2 weekly posts tailored to your activity",
      "One export format for your primary use",
      "Basic marketing copy for every design",
      "High-quality HD downloads",
      "Simple gallery to organize your work",
    ],
  },
  growth: {
    ar: [
      "35 تصميم ذكي شهرياً (حضور أقوى ومبيعات أكثر)",
      "3–4 محتوى أسبوعياً لضمان الاستمرارية",
      "3 أحجام تصدير (بوست، ستوري، واتس)",
      "نصوص تسويقية قوية تركز على الإقناع",
      "حفظ هوية علامتك التجارية (لوجو + ألوان)",
      "تنزيل حزمة كاملة بضغطة واحدة",
      "معرض منظم لتتبع محتواك الشهري",
    ],
    en: [
      "35 AI designs/month (Stronger presence)",
      "3-4 weekly posts for consistency",
      "3 export formats (Post, Story, WhatsApp)",
      "High-converting persuasive copy",
      "Saved brand identity (Logo + Colors)",
      "Full pack download in one click",
      "Organized gallery to track your content",
    ],
  },
  dominant: {
    ar: [
      "70 تصميم ذكي شهرياً (حضور قوي طوال الشهر)",
      "محتوى يومي تقريباً لزيادة التفاعل والطلبات",
      "توليد موجه بالأهداف (عرض – منتج – خدمة – موسمي)",
      "عبارات تحويل ذكية (CTA) لرفع المبيعات والرسائل",
      "تصدير تلقائي لكل المقاسات بدون ما تختار كل مرة",
      "أرشيف متقدم لتسلسل وتنظيم المحتوى",
      "أولوية في التوليد لسرعة أعلى وقت الزحمة",
      "مرشحات محتوى ذكية (عروض/مواسم/أقسام/أنواع)",
    ],
    en: [
      "70 AI designs/month (Dominant presence)",
      "Near-daily content for maximum engagement",
      "Goal-based generation (Offer, Product, Season)",
      "Smart CTA copy to boost sales and messages",
      "Auto-export for all sizes automatically",
      "Advanced archive for content organization",
      "Priority generation during peak times",
      "Smart content filters (Offers/Seasons/Types)",
    ],
  },
};

const PLAN_LABELS: Record<PlanKey, { ar: string; en: string }> = {
  starter: { ar: "خطة أساسي (Starter)", en: "Starter Plan" },
  growth: { ar: "خطة احترافي (Pro)", en: "Pro Plan" },
  dominant: { ar: "خطة بريميوم (Premium)", en: "Premium Plan" },
};

const PLAN_SUBTITLES: Record<PlanKey, { ar: string; en: string }> = {
  starter: {
    ar: "ابدأ بسرعة وخلّي حساباتك “شغّالة” بتصاميم جاهزة للنشر بدون تعب.",
    en: "Start quickly and keep your accounts active with ready-to-publish designs without the hassle.",
  },
  growth: {
    ar: "خلي ظهورك أقوى… محتوى أكثر، مقاسات أكثر، ونتيجة أحسن للمبيعات.",
    en: "Make your presence stronger... more content, more sizes, and better results for sales.",
  },
  dominant: {
    ar: "أقصى إنتاجية… محتوى شبه يومي + ذكاء أعلى يركز على الهدف والتحويل.",
    en: "Maximum productivity... near-daily content + higher AI focused on goals and conversion.",
  },
};

const PLAN_BEST_FOR: Record<PlanKey, { ar: string; en: string }> = {
  starter: {
    ar: "بدايات المشاريع + اللي عايز محتوى ثابت بأقل تكلفة.",
    en: "New projects + those who want consistent content at minimal cost.",
  },
  growth: {
    ar: "المتاجر والأنشطة اللي محتاجة تسويق قوي مستمر.",
    en: "Stores and businesses that need strong, continuous marketing.",
  },
  dominant: {
    ar: "اللي عايز يسيطر على السوشيال ويطلع بنتيجة “شركة تسويق”.",
    en: "Those who want to dominate social media and achieve 'marketing agency' results.",
  },
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
      className={`bg-surface-1 rounded-2xl p-8 flex flex-col relative ${
        isPopular
          ? "border-2 border-primary/30 shadow-lg shadow-primary/5"
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
        <span className="text-lg text-muted font-medium">{locale === "ar" ? "/ شهر" : "/ month"}</span>
      </div>
      <p className="text-muted text-sm mb-1">
        {locale === "ar" ? "الشهر الأول:" : "First month:"} {formatPrice(firstMonthPrice)} {locale === "ar" ? "ثم" : "then"} {formatPrice(monthlyPrice)} {locale === "ar" ? "شهرياً" : "monthly"}
      </p>

      <p className="text-sm font-medium text-foreground mt-4 mb-6 leading-relaxed">
        {PLAN_SUBTITLES[planKey][locale]}
      </p>

      <div className="text-sm font-bold mb-3">{locale === "ar" ? "يشمل:" : "Includes:"}</div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check size={14} className={`${checkColor} mt-1 shrink-0`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className={`mt-auto mb-6 p-3 rounded-xl text-xs text-muted-foreground leading-relaxed border ${isPopular ? "bg-primary/5 border-primary/10" : "bg-surface-2 border-card-border/50"}`}>
        <span className="font-bold text-foreground">{locale === "ar" ? "مناسب لـ: " : "Best for: "}</span>
        {PLAN_BEST_FOR[planKey][locale]}
      </div>

      {ctaButton}
    </div>
  );
}

export { PLAN_FEATURES, PLAN_LABELS, PLAN_SUBTITLES, PLAN_BEST_FOR, CHECK_COLORS };
