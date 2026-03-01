"use client";

import { useAuth } from "@/hooks/use-auth";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import {
  Plus,
  Sparkles,
  Upload,
  Download,
  Languages,
  Palette,
  Smartphone,
  Image as ImageIcon,
  Zap,
  Check,
  ArrowLeft,
  Star,
  ShieldCheck,
  UtensilsCrossed,
  ShoppingCart,
  Store,
  Wrench,
  Shirt,
} from "lucide-react";
import { AnimateOnScroll, StaggerOnScroll } from "./animate-on-scroll";
import { STAGGER_ITEM, TAP_SCALE } from "@/lib/animation";
import type { PricingSet } from "@/lib/country-pricing";
import { formatPrice } from "@/lib/country-pricing";
import type { AppLocale } from "@/lib/i18n";
import { ShowcaseCarousel } from "./showcase-carousel";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

const HeroVisual = dynamic(
  () => import("./hero-visual.v1").then((mod) => mod.HeroVisual),
  { loading: () => <div className="w-full max-w-xs lg:max-w-sm aspect-[3/4] rounded-3xl bg-surface-2 animate-pulse" /> }
);

const STEPS = [
  {
    icon: Upload,
    title: { ar: "ارفع صورة منتجك", en: "Upload your product image" },
    description: {
      ar: "ارفع صورة الوجبة أو المنتج من جوالك",
      en: "Upload a meal or product image from your phone",
    },
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Sparkles,
    title: { ar: "بوستاتي يبدع لك", en: "Postaty builds it for you" },
    description: {
      ar: "بوستاتي يختار الألوان والتخطيط والنصوص تلقائياً",
      en: "Postaty picks colors, layout, and copy automatically",
    },
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Download,
    title: { ar: "حمّل وانشر فوراً", en: "Download and publish instantly" },
    description: {
      ar: "جاهز للنشر على انستجرام وفيسبوك وواتساب",
      en: "Ready for Instagram, Facebook, and WhatsApp",
    },
    color: "text-success",
    bg: "bg-success/10",
  },
];

// ─── Features ──────────────────────────────────────────────
const FEATURES = [
  {
    icon: Sparkles,
    title: { ar: "تقنية ذكية متقدمة", en: "Advanced AI technology" },
    description: { ar: "يفهم منتجك ويختار التصميم المناسب", en: "Understands your product and picks the right design" },
  },
  {
    icon: Languages,
    title: { ar: "عربي 100%", en: "Arabic & English ready" },
    description: { ar: "نصوص وخطوط عربية احترافية", en: "Professional bilingual copy and typography" },
  },
  {
    icon: Palette,
    title: { ar: "هوية علامتك التجارية", en: "Brand identity built-in" },
    description: { ar: "لوجو وألوانك في كل تصميم", en: "Your logo and colors in every design" },
  },
  {
    icon: Smartphone,
    title: { ar: "6 أحجام جاهزة", en: "6 ready-made formats" },
    description: { ar: "انستجرام، فيسبوك، واتساب، وأكثر", en: "Instagram, Facebook, WhatsApp, and more" },
  },
  {
    icon: ImageIcon,
    title: { ar: "جودة عالية HD", en: "High-quality HD" },
    description: { ar: "جاهز للطباعة والنشر الرقمي", en: "Ready for print and digital publishing" },
  },
  {
    icon: Zap,
    title: { ar: "أسرع من أي مصمم", en: "Faster than any designer" },
    description: { ar: "30 ثانية مقابل أيام انتظار", en: "30 seconds instead of days of waiting" },
  },
];

// ─── Categories ────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "restaurant" as const,
    icon: UtensilsCrossed,
    title: { ar: "مطاعم وكافيهات", en: "Restaurants & Cafes" },
    subtitle: { ar: "عروض تفتح الشهية", en: "Appetizing offers that convert" },
    bullets: {
      ar: ["بوسترات وجبات احترافية", "عروض رمضان والمناسبات", "تصاميم تزيد الطلبات"],
      en: ["Professional food posters", "Ramadan and seasonal campaigns", "Designs that boost orders"],
    },
    gradient: "from-orange-500 to-red-500",
    glow: "shadow-orange-500/20",
    border: "border-orange-500/20 hover:border-orange-500/40",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
  },
  {
    id: "supermarket" as const,
    icon: ShoppingCart,
    title: { ar: "سوبر ماركت", en: "Supermarkets" },
    subtitle: { ar: "عروض أسبوعية تجذب الزبائن", en: "Weekly offers that attract shoppers" },
    bullets: {
      ar: ["عروض المنتجات المتعددة", "تصاميم عروض الأسبوع", "بوسترات الخصومات"],
      en: ["Multi-product promotions", "Weekly deals creatives", "Discount-focused posters"],
    },
    gradient: "from-emerald-400 to-teal-500",
    glow: "shadow-emerald-500/20",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    id: "ecommerce" as const,
    icon: Store,
    title: { ar: "متاجر إلكترونية", en: "E-commerce stores" },
    subtitle: { ar: "إعلانات تزيد مبيعاتك", en: "Ads that increase sales" },
    bullets: {
      ar: ["بوسترات منتجات جذابة", "إعلانات خصومات حصرية", "تصاميم سوشيال ميديا"],
      en: ["Eye-catching product posters", "Exclusive discount ads", "Social-ready creatives"],
    },
    gradient: "from-violet-500 to-fuchsia-500",
    glow: "shadow-violet-500/20",
    border: "border-violet-500/20 hover:border-violet-500/40",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
  },
  {
    id: "services" as const,
    icon: Wrench,
    title: { ar: "خدمات", en: "Services" },
    subtitle: { ar: "إعلانات احترافية لخدماتك", en: "Professional ads for your services" },
    bullets: {
      ar: ["صيانة وتنظيف واستشارات", "تصاميم تبني الثقة", "بوسترات بتفاصيل الخدمة"],
      en: ["Maintenance, cleaning, and consulting", "Trust-building visuals", "Service-detail posters"],
    },
    gradient: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/20",
    border: "border-blue-500/20 hover:border-blue-500/40",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    id: "fashion" as const,
    icon: Shirt,
    title: { ar: "أزياء وموضة", en: "Fashion & Apparel" },
    subtitle: { ar: "تصاميم أنيقة لعلامتك", en: "Elegant visuals for your brand" },
    bullets: {
      ar: ["بوسترات ملابس وإكسسوارات", "عروض مقاسات وألوان", "تصاميم بطابع مجلات الموضة"],
      en: ["Clothing and accessories posters", "Size and color promotions", "Magazine-style layouts"],
    },
    gradient: "from-pink-500 to-rose-500",
    glow: "shadow-pink-500/20",
    border: "border-pink-500/20 hover:border-pink-500/40",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-400",
  },
  {
    id: "beauty" as const,
    icon: Sparkles,
    title: { ar: "تجميل وعناية", en: "Beauty & Care" },
    subtitle: { ar: "بوسترات جذابة لصالونك", en: "Attractive creatives for your salon" },
    bullets: {
      ar: ["خدمات تجميل وسبا", "منتجات عناية بالبشرة", "عروض حجوزات وجلسات"],
      en: ["Beauty and spa services", "Skincare product promotions", "Booking and session offers"],
    },
    gradient: "from-fuchsia-400 to-purple-500",
    glow: "shadow-fuchsia-500/20",
    border: "border-fuchsia-500/20 hover:border-fuchsia-500/40",
    iconBg: "bg-fuchsia-500/10",
    iconColor: "text-fuchsia-400",
  },
];

type HomeClientProps = {
  pricing: PricingSet;
  countryCode: string;
  locale: AppLocale;
};

export default function HomeClient({ pricing, countryCode, locale }: HomeClientProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { data: showcaseImagesQuery } = useSWR('/api/showcase', fetcher);
  const showcaseImages = showcaseImagesQuery?.showcaseImages ?? [];
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  // Before/After are static local images; admin-selected showcase images fill the bento cards
  const showcaseCard1 = showcaseImages[0];
  const showcaseTall = showcaseImages[1];
  const showcaseCard2 = showcaseImages[2];
  const starterFeatures =
    locale === "ar"
      ? [
          "15 تصميم ذكي شهرياً (جاهزين للنشر خلال دقائق)",
          "1–2 محتوى أسبوعياً مناسب لحسابك ونشاطك",
          "مقاس تصدير واحد حسب استخدامك الأساسي",
          "نصوص تسويقية أساسية جاهزة مع كل تصميم",
          "تحميل بجودة HD للنشر بثقة",
          "معرض بسيط لترتيب أعمالك والرجوع لها بسهولة",
        ]
      : ["15 AI designs/month (Ready in minutes)", "1-2 weekly posts tailored to your activity", "One export format for your primary use", "Basic marketing copy for every design", "High-quality HD downloads", "Simple gallery to organize your work"];
  const growthFeatures =
    locale === "ar"
      ? [
          "35 تصميم ذكي شهرياً (حضور أقوى ومبيعات أكثر)",
          "3–4 محتوى أسبوعياً لضمان الاستمرارية",
          "3 أحجام تصدير (بوست، ستوري، واتس)",
          "نصوص تسويقية قوية تركز على الإقناع",
          "حفظ هوية علامتك التجارية (لوجو + ألوان)",
          "تنزيل حزمة كاملة بضغطة واحدة",
          "معرض منظم لتتبع محتواك الشهري",
        ]
      : ["35 AI designs/month (Strong presence)", "3-4 weekly posts for consistency", "3 export formats (Post, Story, WhatsApp)", "High-converting persuasive copy", "Saved brand identity (Logo + Colors)", "Full pack download in one click", "Organized gallery to track your content"];
  const dominantFeatures =
    locale === "ar"
      ? [
          "70 تصميم ذكي شهرياً (حضور قوي طوال الشهر)",
          "محتوى يومي تقريباً لزيادة التفاعل والطلبات",
          "توليد موجه بالأهداف (عرض – منتج – خدمة – موسمي)",
          "عبارات تحويل ذكية (CTA) لرفع المبيعات والرسائل",
          "تصدير تلقائي لكل المقاسات بدون ما تختار كل مرة",
          "أرشيف متقدم لتسلسل وتنظيم المحتوى",
          "أولوية في التوليد لسرعة أعلى وقت الزحمة",
          "مرشحات محتوى ذكية (عروض/مواسم/أقسام/أنواع)",
        ]
      : ["70 AI designs/month (Dominant presence)", "Near-daily content for maximum engagement", "Goal-based generation (Offer, Product, Season)", "Smart CTA copy to boost sales and messages", "Auto-export for all sizes automatically", "Advanced archive for content organization", "Priority generation during peak times", "Smart content filters (Offers/Seasons/Types)"];
  void countryCode;

  const renderAuthButton = (redirectUrl: string, label: string, className: string, isMotion = false) => {
    if (!isSignedIn) {
      return (
        <Link href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`} className={className}>
          {label}
        </Link>
      );
    }
    if (isMotion) {
      return (
        <motion.button whileTap={TAP_SCALE} onClick={() => router.push(redirectUrl)} className={className}>
          {label}
        </motion.button>
      );
    }
    return (
      <button onClick={() => router.push(redirectUrl)} className={className}>
        {label}
      </button>
    );
  };

  return (
    <main className="min-h-screen relative overflow-x-hidden pb-32 md:pb-0">
      <div className="bg-grid-pattern absolute inset-0 opacity-30 pointer-events-none" />

      {/* SECTION 1: HERO */}
      <section id="hero" className="relative pt-8 pb-16 px-4 md:pt-16 md:pb-24 border-b border-card-border">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-primary/5 rounded-full blur-3xl md:blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[220px] h-[220px] md:w-[400px] md:h-[400px] bg-accent/5 rounded-full blur-2xl md:blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-16 relative">
          <motion.div
            className="flex-1 space-y-6 text-center lg:text-right"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold">
              <Sparkles size={14} />
              <span>{t("مدعوم بتقنية بوستاتي", "Powered by Postaty AI")}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
              {t("بوستاتي —", "Postaty —")}
              <br />
              <span className="text-gradient">{t("تصميم يشد .. تسويق يقنع", "Designs that attract .. Marketing that converts")}</span>
            </h1>

            <p className="text-lg text-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t(
                "بوستاتي يحول صورة منتجك إلى إعلان احترافي يركز على أهدافك البيعية، مع تحسينات ذكية لظهور أقوى (SEO) لعلامتك التجارية.",
                "Postaty turns your product image into a professional ad focused on your sales goals, with smart SEO optimizations for a stronger brand presence."
              )}
              <br className="hidden md:block" />
              {t("تصميم ذكي، تسويق فعال، ونتائج حقيقية.", "Smart design, effective marketing, and real results.")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              {!isSignedIn ? (
                <Link
                  href="/sign-in?redirect_url=/pricing"
                  className="px-8 py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-lg"
                >
                  {t("ابدأ تصميمك الآن", "Start Designing Now")}
                </Link>
              ) : (
                <motion.button
                  whileTap={TAP_SCALE}
                  onClick={() => router.push("/create")}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-lg"
                >
                  <Plus size={22} />
                  <span>{t("تصميم جديد", "Create New Design")}</span>
                </motion.button>
              )}

              <a
                href="#results-showcase"
                className="px-6 py-4 border border-card-border text-muted hover:text-foreground hover:border-primary/30 rounded-2xl font-bold transition-all"
              >
                {t("شاهد النتائج", "View Results")}
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2 text-xs text-muted">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-card-border bg-surface-1/70">
                <ShieldCheck size={13} className="text-success" />
                <span>{t("هوية علامتك محفوظة", "Your brand identity stays consistent")}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-card-border bg-surface-1/70">
                <Star size={13} className="text-warning" />
                <span>{t("جاهز للنشر فوراً", "Ready to publish instantly")}</span>
              </div>
            </div>
          </motion.div>

          <div className="w-full max-w-xs lg:max-w-sm">
            <HeroVisual />
          </div>
        </div>
      </section>
      <ShowcaseCarousel showcaseImages={showcaseImages} />
      {/* SECTION 2: RESULTS SHOWCASE (BENTO GRID) */}
      <section id="results-showcase" className="py-14 md:py-24 px-4 border-b border-card-border bg-surface-2/30">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-5">
              <Sparkles size={14} />
              <span>{t("نماذج تم إنشاؤها فعلياً", "Real designs generated with Postaty")}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black leading-tight mb-4">
              {t("نتائج جاهزة للنشر", "Publish-ready results")} <span className="text-gradient">{t("بجودة احترافية", "with professional quality")}</span>
            </h2>
             <p className="text-muted text-base md:text-lg max-w-2xl mx-auto">
              {t(
                "هذه أمثلة حقيقية من تصاميم تم إنتاجها ببوستاتي. نفس الجودة التي تشاهدها هنا يمكنك إنشاؤها لعلامتك خلال دقائق.",
                "These are real examples generated by Postaty. You can create the same quality for your brand in minutes."
              )}
            </p>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[240px]">

            {/* 1. Large Feature Card (Before/After) - Spans 2x2 */}
            <motion.div
               className="row-span-2 md:col-span-2 rounded-3xl border border-card-border bg-surface-1 overflow-hidden relative group p-6 flex flex-col justify-between"
               initial={false}
               animate={{ opacity: 1, y: 0 }}
            >
               <div className="z-10 relative">
                 <h3 className="text-xl font-bold mb-2">{t("تحول فوري للصور", "Instant image transformation")}</h3>
                 <p className="text-muted text-sm">{t("من صورة جوال عادية إلى بوستر إعلاني متكامل في ثوانٍ", "From a casual phone shot to a complete ad poster in seconds")}</p>
               </div>

               <div className="absolute inset-0 mt-20 px-6 pb-6 flex items-end justify-center">
                  <div className="relative w-full h-full flex gap-2 items-end">
                      <div className="flex-1 h-[80%] relative rounded-xl overflow-hidden border border-card-border/50 rotate-[-3deg] translate-y-4 group-hover:translate-y-2 group-hover:rotate-[-5deg] transition-all duration-500 shadow-lg">
                         <Image src="/showcase/shawrma.jpeg" alt={t("قبل", "Before")} fill sizes="(max-width: 768px) 42vw, 26vw" className="object-cover grayscale" />
                         <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">{t("قبل", "Before")}</div>
                      </div>
                      <div className="flex-1 h-full relative rounded-xl overflow-hidden border border-primary/30 rotate-[2deg] z-10 shadow-2xl group-hover:scale-105 transition-all duration-500">
                         <Image src="/showcase/image.png" alt={t("بعد", "After")} fill sizes="(max-width: 768px) 42vw, 26vw" className="object-cover" />
                         <div className="absolute top-2 right-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded">{t("بعد", "After")}</div>
                      </div>
                  </div>
               </div>
            </motion.div>

            {/* 2. Stat Card 1 */}
             <motion.div
               className="md:col-span-1 md:row-span-1 rounded-3xl border border-card-border bg-surface-1 p-6 flex flex-col justify-center items-center text-center relative overflow-hidden"
               initial={false}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
            >
                <div className="absolute inset-0 bg-primary/5 opacity-0 hover:opacity-100 transition-opacity" />
                <h3 className="text-4xl md:text-5xl font-black text-foreground mb-2">+2k</h3>
                <p className="text-muted text-sm font-medium">{t("تصميم تم إنشاؤه", "Designs generated")}</p>
            </motion.div>

            {/* 3. Showcase Image 1 */}
            <motion.div
               className="md:col-span-1 md:row-span-1 rounded-3xl border border-card-border bg-surface-1 overflow-hidden relative group"
               initial={false}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
            >
               {showcaseCard1?.url ? (
                 <Image src={showcaseCard1.url} alt={showcaseCard1.title || t("تصميم مُنشأ بالذكاء الاصطناعي", "AI generated design")} fill sizes="(max-width: 768px) 92vw, (max-width: 1024px) 32vw, 24vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
               ) : (
                 <div className="w-full h-full bg-surface-2" />
               )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                {showcaseCard1?.category && <span className="absolute bottom-4 right-4 text-white font-bold text-sm">{showcaseCard1.category}</span>}
            </motion.div>

            {/* 4. Stat Card 2 */}
            <motion.div
               className="md:col-span-1 md:row-span-1 rounded-3xl border border-card-border bg-surface-1 p-6 flex flex-col justify-center items-center text-center"
               initial={false}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
            >
                <Zap size={32} className="text-primary mb-3" />
                <h3 className="text-2xl font-bold mb-1">{t("30 ثانية", "30 sec")}</h3>
                <p className="text-muted text-sm">{t("متوسط وقت التصميم", "Average design time")}</p>
            </motion.div>


             {/* 5. Showcase Image (Tall) */}
             <motion.div
               className="row-span-2 rounded-3xl border border-card-border bg-surface-1 overflow-hidden relative group"
               initial={false}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
            >
               {showcaseTall?.url ? (
                 <Image src={showcaseTall.url} alt={showcaseTall.title || t("تصميم مُنشأ بالذكاء الاصطناعي", "AI generated design")} fill sizes="(max-width: 768px) 92vw, (max-width: 1024px) 32vw, 24vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
               ) : (
                 <div className="w-full h-full bg-surface-2" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
               {showcaseTall?.category && <span className="absolute bottom-4 right-4 text-white font-bold text-sm">{showcaseTall.category}</span>}
            </motion.div>

             {/* 6. Text/CTA Card */}
             <motion.div
               className="md:col-span-2 md:row-span-1 rounded-3xl border border-card-border bg-gradient-to-br from-primary/10 to-accent/5 p-6 flex items-center justify-between relative overflow-hidden group"
               initial={false}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5 }}
            >
               <div className="relative z-10">
                   <h3 className="text-xl font-bold mb-1">{t("جرب بنفسك الآن", "Try it yourself now")}</h3>
                   <p className="text-muted text-sm">{t("لا يحتاج بطاقة ائتمان للتجربة", "No credit card required to try")}</p>
               </div>
               <div className="relative z-10">
                   <Link href="/create" className="flex items-center gap-2 bg-surface-1 text-foreground px-5 py-2.5 rounded-xl font-bold hover:scale-105 transition-transform shadow-sm">
                      <span>{t("اصنع بوستر", "Create Poster")}</span>
                      <ArrowLeft size={16} />
                   </Link>
               </div>

               <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
               <div className="absolute left-0 bottom-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -ml-5 -mb-5" />
            </motion.div>

            {/* 7. Showcase Image */}
             <motion.div
               className="md:col-span-1 md:row-span-1 rounded-3xl border border-card-border bg-surface-1 overflow-hidden relative group"
               initial={false}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.6 }}
            >
               {showcaseCard2?.url ? (
                 <Image src={showcaseCard2.url} alt={showcaseCard2.title || t("تصميم مُنشأ بالذكاء الاصطناعي", "AI generated design")} fill sizes="(max-width: 768px) 92vw, (max-width: 1024px) 32vw, 24vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
               ) : (
                 <div className="w-full h-full bg-surface-2" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
               {showcaseCard2?.category && <span className="absolute bottom-4 right-4 text-white font-bold text-sm">{showcaseCard2.category}</span>}
            </motion.div>

          </div>
        </div>
      </section>

      {/* SECTION 4: SOCIAL PROOF BAR */}
      <AnimateOnScroll>
        <section className="py-8 border-b border-card-border">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 space-x-reverse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-surface-2 border-2 border-background" />
                ))}
              </div>
              <span className="text-sm text-muted font-medium">{t("+500 مطعم ومتجر يستخدم Postaty", "500+ restaurants and stores use Postaty")}</span>
            </div>
            <div className="h-6 w-px bg-card-border hidden md:block" />
            <div className="flex items-center gap-2 text-sm text-muted">
              <Sparkles size={14} className="text-primary" />
              <span className="font-bold text-foreground">2,000+</span> {t("تصميم تم إنشاؤه", "designs generated")}
            </div>
            <div className="h-6 w-px bg-card-border hidden md:block" />
            <div className="flex items-center gap-2 text-sm text-muted">
              <Zap size={14} className="text-primary" />
              {t("متوسط", "Average")} <span className="font-bold text-foreground">{t("30 ثانية", "30 seconds")}</span> {t("للتصميم", "per design")}
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      {/* SECTION 5: HOW IT WORKS */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimateOnScroll className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              {t("3 خطوات فقط —", "Only 3 steps -")} <span className="text-gradient">{t("وإعلانك جاهز", "and your ad is ready")}</span>
            </h2>
            <p className="text-muted text-lg">{t("من الصورة للبوستر الاحترافي في ثوانٍ", "From image to pro poster in seconds")}</p>
          </AnimateOnScroll>

          <StaggerOnScroll className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={idx}
                  variants={STAGGER_ITEM}
                  className="relative bg-surface-1 border border-card-border rounded-2xl p-8 text-center group hover:-translate-y-1 transition-transform"
                >
                  <div className="absolute -top-3 right-6 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm font-black flex items-center justify-center">
                    {idx + 1}
                  </div>

                  <div className={`w-14 h-14 ${step.bg} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                    <Icon size={28} className={step.color} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title[locale]}</h3>
                  <p className="text-muted text-sm leading-relaxed">{step.description[locale]}</p>

                  {idx < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -left-4 -translate-y-1/2">
                      <ArrowLeft size={20} className="text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </StaggerOnScroll>
        </div>
      </section>

      {/* SECTION 4: CATEGORY SHOWCASE */}
      <section id="categories" className="py-16 md:py-24 px-4 border-t border-card-border">
        <div className="max-w-6xl mx-auto">
          <AnimateOnScroll className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              {t("مهما كان نشاطك —", "Whatever your business -")} <span className="text-gradient">{t("عندنا الحل", "we have the solution")}</span>
            </h2>
            <p className="text-muted text-lg">{t("تصاميم مخصصة حسب نوع عملك", "Tailored creatives for your business type")}</p>
          </AnimateOnScroll>

          <StaggerOnScroll className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  variants={STAGGER_ITEM}
                  onClick={() => router.push(`/create?category=${cat.id}`)}
                  className={`relative group cursor-pointer bg-surface-1 border ${cat.border} rounded-2xl p-8 ${locale === "ar" ? "text-right" : "text-left"} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cat.glow} overflow-hidden`}
                >
                  <div className={`w-14 h-14 ${cat.iconBg} rounded-2xl flex items-center justify-center mb-5`}>
                    <Icon size={28} className={cat.iconColor} />
                  </div>

                  <h3 className="text-2xl font-bold mb-1">{cat.title[locale]}</h3>
                  <p className="text-muted text-sm mb-5">{cat.subtitle[locale]}</p>

                  <ul className="space-y-2 mb-6">
                    {cat.bullets[locale].map((bullet, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted">
                        <Check size={14} className={cat.iconColor} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className={`flex items-center gap-2 text-sm font-bold ${cat.iconColor} group-hover:gap-3 transition-all`}>
                    <span>{t("ابدأ التصميم", "Start design")}</span>
                    <ArrowLeft size={14} />
                  </div>

                  <div className={`absolute -bottom-6 -left-6 w-28 h-28 bg-gradient-to-tr ${cat.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
                </motion.div>
              );
            })}
          </StaggerOnScroll>
        </div>
      </section>

      {/* SECTION 5: FEATURES GRID */}
      <section className="py-16 md:py-24 px-4 border-t border-card-border">
        <div className="max-w-5xl mx-auto">
          <AnimateOnScroll className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              {t("ليش Postaty", "Why Postaty")} <span className="text-gradient">{t("أحسن من المصمم؟", "is better than hiring a designer?")}</span>
            </h2>
            <p className="text-muted text-lg">{t("كل اللي تحتاجه في أداة واحدة", "Everything you need in one tool")}</p>
          </AnimateOnScroll>

          <StaggerOnScroll className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  variants={STAGGER_ITEM}
                  className="bg-surface-1 border border-card-border rounded-xl p-6 hover:-translate-y-0.5 transition-transform"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">{feature.title[locale]}</h3>
                  <p className="text-muted text-sm">{feature.description[locale]}</p>
                </motion.div>
              );
            })}
          </StaggerOnScroll>
        </div>
      </section>

      {/* SECTION 6: PRICING PREVIEW */}
      <section className="py-16 md:py-24 px-4 border-t border-card-border">
        <div className="max-w-6xl mx-auto">
          <AnimateOnScroll className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              {t("اختر خطتك —", "Choose your plan -")} <span className="text-gradient">{t("الشهر الأول مخفض", "first month discounted")}</span>
            </h2>
            <p className="text-muted text-lg">
              {t("جميع الخطط مع ضمان استرجاع الأموال 30 يوم", "All plans include a 30-day money-back guarantee")}
            </p>
          </AnimateOnScroll>

          <StaggerOnScroll className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <motion.div variants={STAGGER_ITEM} className="bg-surface-1 border border-card-border rounded-2xl p-8 flex flex-col">
              <div className="text-sm font-bold text-muted mb-2">{t("خطة أساسي (Starter)", "Starter Plan")}</div>
              <div className="text-4xl font-black mb-1">
                {formatPrice(pricing.starter.monthly)} <span className="text-lg text-muted font-medium">{t("/ شهر", "/ month")}</span>
              </div>
              <p className="text-muted text-sm mb-1">{t("الشهر الأول:", "First month:")} {formatPrice(pricing.starter.firstMonth)} {t("ثم", "then")} {formatPrice(pricing.starter.monthly)} {t("شهرياً", "monthly")}</p>
              
              <p className="text-sm font-medium text-foreground mt-4 mb-6 leading-relaxed">
                {t("ابدأ بسرعة وخلّي حساباتك “شغّالة” بتصاميم جاهزة للنشر بدون تعب.", "Start quickly and keep your accounts active with ready-to-publish designs without the hassle.")}
              </p>

              <div className="text-sm font-bold mb-3">{t("يشمل:", "Includes:")}</div>
              <ul className="space-y-3 mb-8 flex-1">
                {starterFeatures.map((item, i) => (<li key={i} className="flex items-start gap-2 text-sm"><Check size={14} className="text-success mt-1 shrink-0" /><span>{item}</span></li>))}
              </ul>
              
              <div className="mt-auto mb-6 p-3 bg-surface-2 rounded-xl text-xs text-muted-foreground leading-relaxed border border-card-border/50">
                <span className="font-bold text-foreground">{t("مناسب لـ: ", "Best for: ")}</span>
                {t("بدايات المشاريع + اللي عايز محتوى ثابت بأقل تكلفة.", "New projects + those who want consistent content at minimal cost.")}
              </div>

              {renderAuthButton("/checkout?plan=starter", t("اشترك الآن", "Subscribe now"), "w-full py-3 border border-card-border rounded-xl font-bold text-foreground text-center hover:bg-surface-2 transition-colors block")}
            </motion.div>

            {/* Growth Plan */}
            <motion.div variants={STAGGER_ITEM} className="bg-surface-1 border-2 border-primary/30 rounded-2xl p-8 relative flex flex-col shadow-lg shadow-primary/5">
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">{t("الأكثر شعبية", "Most popular")}</div>
              <div className="text-sm font-bold text-primary mb-2">{t("خطة احترافي (Pro)", "Pro Plan")}</div>
              <div className="text-4xl font-black mb-1">
                {formatPrice(pricing.growth.monthly)} <span className="text-lg text-muted font-medium">{t("/ شهر", "/ month")}</span>
              </div>
              <p className="text-muted text-sm mb-1">{t("الشهر الأول:", "First month:")} {formatPrice(pricing.growth.firstMonth)} {t("ثم", "then")} {formatPrice(pricing.growth.monthly)} {t("شهرياً", "monthly")}</p>
              
              <p className="text-sm font-medium text-foreground mt-4 mb-6 leading-relaxed">
                {t("خلي ظهورك أقوى… محتوى أكثر، مقاسات أكثر، ونتيجة أحسن للمبيعات.", "Make your presence stronger... more content, more sizes, and better results for sales.")}
              </p>

              <div className="text-sm font-bold mb-3">{t("يشمل:", "Includes:")}</div>
              <ul className="space-y-3 mb-8 flex-1">
                {growthFeatures.map((item, i) => (<li key={i} className="flex items-start gap-2 text-sm"><Check size={14} className="text-primary mt-1 shrink-0" /><span>{item}</span></li>))}
              </ul>

              <div className="mt-auto mb-6 p-3 bg-primary/5 rounded-xl text-xs text-muted-foreground leading-relaxed border border-primary/10">
                <span className="font-bold text-foreground">{t("مناسب لـ: ", "Best for: ")}</span>
                {t("المتاجر والأنشطة اللي محتاجة تسويق قوي مستمر.", "Stores and businesses that need strong, continuous marketing.")}
              </div>

              {renderAuthButton("/checkout?plan=growth", t("اشترك الآن", "Subscribe now"), "w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold text-center hover:shadow-lg hover:shadow-primary/25 transition-all block")}
            </motion.div>

            {/* Dominant Plan */}
            <motion.div variants={STAGGER_ITEM} className="bg-surface-1 border border-card-border rounded-2xl p-8 flex flex-col">
              <div className="text-sm font-bold text-muted mb-2">{t("خطة بريميوم (Premium)", "Premium Plan")}</div>
              <div className="text-4xl font-black mb-1">
                {formatPrice(pricing.dominant.monthly)} <span className="text-lg text-muted font-medium">{t("/ شهر", "/ month")}</span>
              </div>
              <p className="text-muted text-sm mb-1">{t("الشهر الأول:", "First month:")} {formatPrice(pricing.dominant.firstMonth)} {t("ثم", "then")} {formatPrice(pricing.dominant.monthly)} {t("شهرياً", "monthly")}</p>
              
              <p className="text-sm font-medium text-foreground mt-4 mb-6 leading-relaxed">
                {t("أقصى إنتاجية… محتوى شبه يومي + ذكاء أعلى يركز على الهدف والتحويل.", "Maximum productivity... near-daily content + higher AI focused on goals and conversion.")}
              </p>

              <div className="text-sm font-bold mb-3">{t("يشمل:", "Includes:")}</div>
              <ul className="space-y-3 mb-8 flex-1">
                {dominantFeatures.map((item, i) => (<li key={i} className="flex items-start gap-2 text-sm"><Check size={14} className="text-accent mt-1 shrink-0" /><span>{item}</span></li>))}
              </ul>

              <div className="mt-auto mb-6 p-3 bg-surface-2 rounded-xl text-xs text-muted-foreground leading-relaxed border border-card-border/50">
                <span className="font-bold text-foreground">{t("مناسب لـ: ", "Best for: ")}</span>
                {t("اللي عايز يسيطر على السوشيال ويطلع بنتيجة “شركة تسويق”.", "Those who want to dominate social media and achieve 'marketing agency' results.")}
              </div>

              {renderAuthButton("/checkout?plan=dominant", t("اشترك الآن", "Subscribe now"), "w-full py-3 border border-card-border rounded-xl font-bold text-foreground text-center hover:bg-surface-2 transition-colors block")}
            </motion.div>
          </StaggerOnScroll>
        </div>
      </section>

      {/* SECTION 7: FINAL CTA */}
      <section className="py-24 md:py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
        </div>

        <AnimateOnScroll className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {t("أكثر من 500 صاحب مشروع بدأوا معنا", "More than 500 business owners started with us")}
          </div>

          <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            {t("وقتك أغلى من إنك", "Your time is too valuable to")}
            <br />
            <span className="text-gradient">{t("تصمم بوستر بنفسك", "design posters manually")}</span>
          </h2>
          <p className="text-muted text-lg md:text-xl mb-4 max-w-xl mx-auto leading-relaxed">
            {t("بدل ما تدفع لمصمم وتنتظر أيام، خلّي بوستاتي يطلع لك تصميم احترافي في ثوانٍ.", "Instead of paying a designer and waiting days, let Postaty generate pro designs in seconds.")}
          </p>
          <p className="text-muted/60 text-sm mb-10">
            {t("اشتراك شهري مرن · إلغاء في أي وقت", "Flexible monthly subscription · Cancel anytime")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isSignedIn ? (
              <Link
                href="/sign-in?redirect_url=/pricing"
                className="inline-block px-10 py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all"
              >
                {t("اشترك وابدأ الآن", "Subscribe and start now")}
              </Link>
            ) : (
              <motion.button
                whileTap={TAP_SCALE}
                onClick={() => router.push("/create")}
                className="px-10 py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                {t("صمم بوسترك الآن", "Create your poster now")}
              </motion.button>
            )}
          </div>
        </AnimateOnScroll>
      </section>

    </main>
  );
}
