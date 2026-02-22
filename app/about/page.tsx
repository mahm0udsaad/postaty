import type { Metadata } from "next";
import Link from "next/link";
import { Zap, Eye, Globe, Sparkles, Target } from "lucide-react";
import { getRequestLocale } from "@/lib/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  if (locale === "en") {
    return {
      title: "About | Postaty",
      description: "Learn about Postaty and our mission to help businesses create AI-powered professional ads",
    };
  }

  return {
    title: "من نحن | Postaty",
    description: "تعرف على فريق Postaty ورؤيتنا لتمكين أصحاب المشاريع من تصميم إعلانات احترافية بالذكاء الاصطناعي",
  };
}

const values = {
  ar: [
    {
      icon: Zap,
      title: "السرعة",
      description: "نؤمن إن وقت صاحب المشروع أغلى من إنه يضيعه على التصميم. لذلك نوفر تصاميم جاهزة في ثوانٍ.",
    },
    {
      icon: Eye,
      title: "الجودة",
      description: "كل تصميم يطلع من Postaty لازم يكون بمستوى احترافي يليق بعلامتك التجارية.",
    },
    {
      icon: Globe,
      title: "عربي أولاً",
      description: "بنينا المنصة من الصفر للسوق العربي - خطوط عربية، تصميم RTL، ومحتوى يفهم جمهورك.",
    },
    {
      icon: Target,
      title: "البساطة",
      description: "لا تحتاج خبرة تصميم. ارفع صورتك، واحنا نتكفل بالباقي.",
    },
  ],
  en: [
    {
      icon: Zap,
      title: "Speed",
      description: "Your time is valuable. We help you produce ready-to-publish designs in seconds.",
    },
    {
      icon: Eye,
      title: "Quality",
      description: "Every Postaty design is crafted to match a professional standard for your brand.",
    },
    {
      icon: Globe,
      title: "Arabic-first",
      description: "Built for the Arab market from day one with RTL support, Arabic typography, and localized style.",
    },
    {
      icon: Target,
      title: "Simplicity",
      description: "No design background needed. Upload your image and Postaty handles the rest.",
    },
  ],
} as const;

const stats = {
  ar: [
    { value: "+2,000", label: "تصميم تم إنشاؤه" },
    { value: "+500", label: "صاحب مشروع" },
    { value: "30 ثانية", label: "متوسط وقت التصميم" },
    { value: "6", label: "أحجام جاهزة لكل منصة" },
  ],
  en: [
    { value: "+2,000", label: "Designs generated" },
    { value: "+500", label: "Business owners" },
    { value: "30 sec", label: "Average design time" },
    { value: "6", label: "Ready sizes per platform" },
  ],
} as const;

export default async function AboutPage() {
  const locale = await getRequestLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <Sparkles size={16} />
            {t("من نحن", "About us")}
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            {t("نصمم المستقبل", "Designing the future")}
            <br />
            <span className="text-gradient">{t("لأصحاب المشاريع العرب", "for business owners")}</span>
          </h1>
          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {t(
              "Postaty منصة ذكاء اصطناعي امراتيه تمكّن أصحاب المطاعم والمتاجر والمشاريع الصغيرة من تصميم إعلانات احترافية بدون الحاجة لمصمم أو خبرة تقنية.",
              "Postaty is an AI platform that helps restaurant owners, stores, and small businesses create professional ads without hiring a designer."
            )}
          </p>
        </div>
      </section>

      <section className="py-16 px-4 border-y border-card-border bg-surface-1">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats[locale].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-primary mb-2">{stat.value}</div>
              <div className="text-muted text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-8 text-center">{t("قصتنا", "Our story")}</h2>
          <div className="space-y-6 text-muted text-lg leading-relaxed">
            <p>
              {t(
                "بدأت فكرة Postaty من مشكلة حقيقية - أصحاب المشاريع الصغيرة والمتوسطة في العالم العربي يحتاجون إعلانات سوشيال ميديا بشكل يومي، لكن توظيف مصمم محترف مكلف.",
                "Postaty started from a real problem: small and medium businesses need daily social media creatives, but hiring designers is expensive."
              )}
            </p>
            <p>
              {t(
                "قررنا نبني أداة تفهم السوق العربي - من الخطوط والألوان إلى أسلوب الكتابة والتسويق. نحول صورة منتج بسيطة إلى تصميم إعلاني احترافي في أقل من 30 ثانية.",
                "We built a tool that understands local needs, from typography to color and marketing style, and turns a simple product photo into a pro ad in under 30 seconds."
              )}
            </p>
            <p>
              {t(
                "رؤيتنا إن كل صاحب مشروع يقدر ينافس الشركات الكبيرة بتصاميم احترافية، بدون ما يحتاج ميزانية تسويق ضخمة.",
                "Our vision is to let every business owner compete with larger brands through professional creatives without massive budgets."
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-surface-1 border-y border-card-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-12 text-center">{t("قيمنا", "Our values")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values[locale].map((value) => (
              <div key={value.title} className="bg-background border border-card-border rounded-2xl p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <value.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-6">{t("جاهز تجرب بنفسك؟", "Ready to try it?")}</h2>
          <p className="text-muted text-lg mb-8">{t("ابدأ مجاناً وشوف كيف Postaty يغير طريقة تسويقك.", "Start free and see how Postaty changes your marketing workflow.")}</p>
          <Link
            href="/create"
            className="inline-block px-10 py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all"
          >
            {t("ابدأ مجاناً", "Start free")}
          </Link>
        </div>
      </section>
    </div>
  );
}
