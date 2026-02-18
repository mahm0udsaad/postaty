"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Sparkles,
  Upload,
  Download,
  Brain,
  Languages,
  Palette,
  Smartphone,
  Image as ImageIcon,
  Zap,
  Check,
  ArrowLeft,
  UtensilsCrossed,
  ShoppingCart,
  Store,
  Wrench,
  Shirt,
} from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { HeroVisual } from "./hero-visual";
import { ShowcaseCarousel } from "./showcase-carousel";
import { AnimateOnScroll, StaggerOnScroll } from "./animate-on-scroll";
import { STAGGER_ITEM, TAP_SCALE } from "@/lib/animation";
import type { PricingSet } from "@/lib/country-pricing";
import { formatPrice } from "@/lib/country-pricing";

const AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// ─── How It Works Steps ────────────────────────────────────
const STEPS = [
  {
    icon: Upload,
    title: "ارفع صورة منتجك",
    description: "ارفع صورة الوجبة أو المنتج من جوالك",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Brain,
    title: "الذكاء الاصطناعي يبدع",
    description: "خوارزميتنا تختار الألوان والتخطيط والنصوص تلقائياً",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Download,
    title: "حمّل وانشر فوراً",
    description: "جاهز للنشر على انستجرام وفيسبوك وواتساب",
    color: "text-success",
    bg: "bg-success/10",
  },
];

// ─── Features ──────────────────────────────────────────────
const FEATURES = [
  {
    icon: Brain,
    title: "ذكاء اصطناعي متقدم",
    description: "يفهم منتجك ويختار التصميم المناسب",
  },
  {
    icon: Languages,
    title: "عربي 100%",
    description: "نصوص وخطوط عربية احترافية",
  },
  {
    icon: Palette,
    title: "هوية علامتك التجارية",
    description: "لوجو وألوانك في كل تصميم",
  },
  {
    icon: Smartphone,
    title: "6 أحجام جاهزة",
    description: "انستجرام، فيسبوك، واتساب، وأكثر",
  },
  {
    icon: ImageIcon,
    title: "جودة عالية HD",
    description: "جاهز للطباعة والنشر الرقمي",
  },
  {
    icon: Zap,
    title: "أسرع من أي مصمم",
    description: "30 ثانية مقابل أيام انتظار",
  },
];

// ─── Categories ────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "restaurant" as const,
    icon: UtensilsCrossed,
    title: "مطاعم وكافيهات",
    subtitle: "عروض تفتح الشهية",
    bullets: ["بوسترات وجبات احترافية", "عروض رمضان والمناسبات", "تصاميم تزيد الطلبات"],
    gradient: "from-orange-500 to-red-500",
    glow: "shadow-orange-500/20",
    border: "border-orange-500/20 hover:border-orange-500/40",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
  },
  {
    id: "supermarket" as const,
    icon: ShoppingCart,
    title: "سوبر ماركت",
    subtitle: "عروض أسبوعية تجذب الزبائن",
    bullets: ["عروض المنتجات المتعددة", "تصاميم عروض الأسبوع", "بوسترات الخصومات"],
    gradient: "from-emerald-400 to-teal-500",
    glow: "shadow-emerald-500/20",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    id: "ecommerce" as const,
    icon: Store,
    title: "متاجر إلكترونية",
    subtitle: "إعلانات تزيد مبيعاتك",
    bullets: ["بوسترات منتجات جذابة", "إعلانات خصومات حصرية", "تصاميم سوشيال ميديا"],
    gradient: "from-violet-500 to-fuchsia-500",
    glow: "shadow-violet-500/20",
    border: "border-violet-500/20 hover:border-violet-500/40",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
  },
  {
    id: "services" as const,
    icon: Wrench,
    title: "خدمات",
    subtitle: "إعلانات احترافية لخدماتك",
    bullets: ["صيانة وتنظيف واستشارات", "تصاميم تبني الثقة", "بوسترات بتفاصيل الخدمة"],
    gradient: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/20",
    border: "border-blue-500/20 hover:border-blue-500/40",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    id: "fashion" as const,
    icon: Shirt,
    title: "أزياء وموضة",
    subtitle: "تصاميم أنيقة لعلامتك",
    bullets: ["بوسترات ملابس وإكسسوارات", "عروض مقاسات وألوان", "تصاميم بطابع مجلات الموضة"],
    gradient: "from-pink-500 to-rose-500",
    glow: "shadow-pink-500/20",
    border: "border-pink-500/20 hover:border-pink-500/40",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-400",
  },
  {
    id: "beauty" as const,
    icon: Sparkles,
    title: "تجميل وعناية",
    subtitle: "بوسترات جذابة لصالونك",
    bullets: ["خدمات تجميل وسبا", "منتجات عناية بالبشرة", "عروض حجوزات وجلسات"],
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
};

export default function HomeClient({ pricing, countryCode }: HomeClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  return (
    <main className="min-h-screen relative overflow-x-hidden pb-32 md:pb-0">
      <div className="bg-grid-pattern absolute inset-0 opacity-30 pointer-events-none" />

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: HERO
      ═══════════════════════════════════════════════════════ */}
      <section className="relative pt-8 pb-16 px-4 md:pt-16 md:pb-24 border-b border-card-border">
        {/* Hero glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-16 relative">
          {/* Text */}
          <motion.div
            className="flex-1 space-y-6 text-center lg:text-right"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold">
              <Sparkles size={14} />
              <span>مدعوم بالذكاء الاصطناعي</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
              بوسترات تبيع
              <br />
              <span className="text-gradient">مش بس تصاميم</span>
            </h1>

            <p className="text-lg text-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
              بوستاتي يصمم لك إعلانات احترافية لمطعمك أو متجرك في 30 ثانية.
              <br className="hidden md:block" />
              بدون مصمم، بدون خبرة.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              {!isAuthenticated ? (
                AUTH_ENABLED ? (
                  <SignInButton forceRedirectUrl="/create">
                    <motion.button
                      whileTap={TAP_SCALE}
                      className="px-8 py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-lg"
                    >
                      ابدأ مجاناً
                    </motion.button>
                  </SignInButton>
                ) : (
                  <Link
                    href="/create"
                    className="px-8 py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-lg"
                  >
                    ابدأ الآن
                  </Link>
                )
              ) : (
                <motion.button
                  whileTap={TAP_SCALE}
                  onClick={() => router.push("/create")}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-lg"
                >
                  <Plus size={22} />
                  <span>تصميم جديد</span>
                </motion.button>
              )}

              <a
                href="#categories"
                className="px-6 py-4 border border-card-border text-muted hover:text-foreground hover:border-primary/30 rounded-2xl font-bold transition-all"
              >
                شوف أمثلة
              </a>
            </div>
          </motion.div>

          {/* Visual */}
          <div className="w-full max-w-xs lg:max-w-sm">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2: SOCIAL PROOF BAR
      ═══════════════════════════════════════════════════════ */}
      <AnimateOnScroll>
        <section className="py-8 border-b border-card-border">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 space-x-reverse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-surface-2 border-2 border-background" />
                ))}
              </div>
              <span className="text-sm text-muted font-medium">+500 مطعم ومتجر يستخدم Postaty</span>
            </div>
            <div className="h-6 w-px bg-card-border hidden md:block" />
            <div className="flex items-center gap-2 text-sm text-muted">
              <Sparkles size={14} className="text-primary" />
              <span className="font-bold text-foreground">2,000+</span> تصميم تم إنشاؤه
            </div>
            <div className="h-6 w-px bg-card-border hidden md:block" />
            <div className="flex items-center gap-2 text-sm text-muted">
              <Zap size={14} className="text-primary" />
              متوسط <span className="font-bold text-foreground">30 ثانية</span> للتصميم
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3: HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimateOnScroll className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              3 خطوات فقط — <span className="text-gradient">وإعلانك جاهز</span>
            </h2>
            <p className="text-muted text-lg">من الصورة للبوستر الاحترافي في ثوانٍ</p>
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
                  {/* Step number */}
                  <div className="absolute -top-3 right-6 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm font-black flex items-center justify-center">
                    {idx + 1}
                  </div>

                  <div className={`w-14 h-14 ${step.bg} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                    <Icon size={28} className={step.color} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{step.description}</p>

                  {/* Connector arrow (desktop only) */}
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

      {/* ═══════════════════════════════════════════════════════
          SECTION 4: CATEGORY SHOWCASE
      ═══════════════════════════════════════════════════════ */}
      <section id="categories" className="py-16 md:py-24 px-4 border-t border-card-border">
        <div className="max-w-6xl mx-auto">
          <AnimateOnScroll className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              مهما كان نشاطك — <span className="text-gradient">عندنا الحل</span>
            </h2>
            <p className="text-muted text-lg">تصاميم مخصصة حسب نوع عملك</p>
          </AnimateOnScroll>

          <StaggerOnScroll className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  variants={STAGGER_ITEM}
                  onClick={() => router.push(`/create?category=${cat.id}`)}
                  className={`group cursor-pointer bg-surface-1 border ${cat.border} rounded-2xl p-8 text-right transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cat.glow}`}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 ${cat.iconBg} rounded-2xl flex items-center justify-center mb-5`}>
                    <Icon size={28} className={cat.iconColor} />
                  </div>

                  <h3 className="text-2xl font-bold mb-1">{cat.title}</h3>
                  <p className="text-muted text-sm mb-5">{cat.subtitle}</p>

                  {/* Bullet points */}
                  <ul className="space-y-2 mb-6">
                    {cat.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted">
                        <Check size={14} className={cat.iconColor} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className={`flex items-center gap-2 text-sm font-bold ${cat.iconColor} group-hover:gap-3 transition-all`}>
                    <span>ابدأ التصميم</span>
                    <ArrowLeft size={14} />
                  </div>

                  {/* Glow decoration */}
                  <div className={`absolute -bottom-6 -left-6 w-28 h-28 bg-gradient-to-tr ${cat.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
                </motion.div>
              );
            })}
          </StaggerOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4.5: SHOWCASE CAROUSEL
      ═══════════════════════════════════════════════════════ */}
      <ShowcaseCarousel />

      {/* ═══════════════════════════════════════════════════════
          SECTION 5: FEATURES GRID
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4 border-t border-card-border">
        <div className="max-w-5xl mx-auto">
          <AnimateOnScroll className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              ليش Postaty <span className="text-gradient">أحسن من المصمم؟</span>
            </h2>
            <p className="text-muted text-lg">كل اللي تحتاجه في أداة واحدة</p>
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
                  <h3 className="text-lg font-bold mb-1">{feature.title}</h3>
                  <p className="text-muted text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </StaggerOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6: PRICING PREVIEW
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4 border-t border-card-border">
        <div className="max-w-6xl mx-auto">
          <AnimateOnScroll className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              اختر خطتك — <span className="text-gradient">الشهر الأول مخفض</span>
            </h2>
            <p className="text-muted text-lg">
              جميع الخطط مع ضمان استرجاع الأموال 30 يوم
              <span className="block text-xs mt-2 opacity-70">
                الأسعار المعروضة حسب موقعك: {countryCode}
              </span>
            </p>
          </AnimateOnScroll>

          <StaggerOnScroll className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <motion.div
              variants={STAGGER_ITEM}
              className="bg-surface-1 border border-card-border rounded-2xl p-8"
            >
              <div className="text-sm font-bold text-muted mb-2">مبتدي</div>
              <div className="text-4xl font-black mb-1">
                {formatPrice(pricing.starter.monthly, pricing.symbol)}{" "}
                <span className="text-lg text-muted font-medium">/شهر</span>
              </div>
              <p className="text-muted text-sm mb-1">
                الشهر الأول: {formatPrice(pricing.starter.firstMonth, pricing.symbol)}
              </p>
              <p className="text-muted text-xs mb-6 opacity-75">
                ثم {formatPrice(pricing.starter.monthly, pricing.symbol)} شهرياً
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "10 تصاميم ذكية شهرياً",
                  "1–2 محتوى أسبوعياً",
                  "حجم تصدير واحد",
                  "نصوص تسويقية أساسية",
                  "تنزيل HD",
                  "معرض بسيط"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check size={14} className="text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated ? (
                AUTH_ENABLED ? (
                  <SignInButton forceRedirectUrl="/checkout?plan=starter">
                    <button className="w-full py-3 border border-card-border rounded-xl font-bold text-foreground hover:bg-surface-2 transition-colors">
                      اشترك الآن
                    </button>
                  </SignInButton>
                ) : (
                  <Link href="/checkout?plan=starter" className="block w-full py-3 border border-card-border rounded-xl font-bold text-foreground text-center hover:bg-surface-2 transition-colors">
                    اشترك الآن
                  </Link>
                )
              ) : (
                <button onClick={() => router.push("/checkout?plan=starter")} className="w-full py-3 border border-card-border rounded-xl font-bold text-foreground hover:bg-surface-2 transition-colors">
                  اشترك الآن
                </button>
              )}
            </motion.div>

            {/* Growth Plan - Most Popular */}
            <motion.div
              variants={STAGGER_ITEM}
              className="bg-surface-1 border-2 border-primary/30 rounded-2xl p-8 relative"
            >
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                الأكثر شعبية
              </div>
              <div className="text-sm font-bold text-primary mb-2">نمو</div>
              <div className="text-4xl font-black mb-1">
                {formatPrice(pricing.growth.monthly, pricing.symbol)}{" "}
                <span className="text-lg text-muted font-medium">/شهر</span>
              </div>
              <p className="text-muted text-sm mb-1">
                الشهر الأول: {formatPrice(pricing.growth.firstMonth, pricing.symbol)}
              </p>
              <p className="text-muted text-xs mb-6 opacity-75">
                ثم {formatPrice(pricing.growth.monthly, pricing.symbol)} شهرياً
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "25 تصميماً ذكياً شهرياً",
                  "3–4 محتوى أسبوعياً",
                  "3 أحجام تصدير (بوست، ستوري، واتس)",
                  "نصوص تسويقية قوية",
                  "الهوية التجارية محفوظة",
                  "تنزيل حزمة كاملة",
                  "معرض منظم"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check size={14} className="text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated ? (
                AUTH_ENABLED ? (
                  <SignInButton forceRedirectUrl="/checkout?plan=growth">
                    <button className="w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold hover:shadow-lg hover:shadow-primary/25 transition-all">
                      اشترك الآن
                    </button>
                  </SignInButton>
                ) : (
                  <Link href="/checkout?plan=growth" className="block w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold text-center hover:shadow-lg hover:shadow-primary/25 transition-all">
                    اشترك الآن
                  </Link>
                )
              ) : (
                <button onClick={() => router.push("/checkout?plan=growth")} className="w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold hover:shadow-lg hover:shadow-primary/25 transition-all">
                  اشترك الآن
                </button>
              )}
            </motion.div>

            {/* Dominant Plan */}
            <motion.div
              variants={STAGGER_ITEM}
              className="bg-surface-1 border border-card-border rounded-2xl p-8"
            >
              <div className="text-sm font-bold text-muted mb-2">هيمنة</div>
              <div className="text-4xl font-black mb-1">
                {formatPrice(pricing.dominant.monthly, pricing.symbol)}{" "}
                <span className="text-lg text-muted font-medium">/شهر</span>
              </div>
              <p className="text-muted text-sm mb-1">
                الشهر الأول: {formatPrice(pricing.dominant.firstMonth, pricing.symbol)}
              </p>
              <p className="text-muted text-xs mb-6 opacity-75">
                ثم {formatPrice(pricing.dominant.monthly, pricing.symbol)} شهرياً
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "50 تصميماً ذكياً شهرياً",
                  "محتوى يومي تقريباً",
                  "توليد موجه بالأهداف",
                  "عبارات تحويل ذكية",
                  "جميع الأحجام مُصَدَّرة تلقائياً",
                  "أرشيف متقدم",
                  "توليد بأولوية",
                  "مرشحات محتوى ذكية"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check size={14} className="text-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated ? (
                AUTH_ENABLED ? (
                  <SignInButton forceRedirectUrl="/checkout?plan=dominant">
                    <button className="w-full py-3 border border-card-border rounded-xl font-bold text-foreground hover:bg-surface-2 transition-colors">
                      اشترك الآن
                    </button>
                  </SignInButton>
                ) : (
                  <Link href="/checkout?plan=dominant" className="block w-full py-3 border border-card-border rounded-xl font-bold text-foreground text-center hover:bg-surface-2 transition-colors">
                    اشترك الآن
                  </Link>
                )
              ) : (
                <button onClick={() => router.push("/checkout?plan=dominant")} className="w-full py-3 border border-card-border rounded-xl font-bold text-foreground hover:bg-surface-2 transition-colors">
                  اشترك الآن
                </button>
              )}
            </motion.div>
          </StaggerOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7: FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 border-t border-card-border relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />

        <AnimateOnScroll className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            أول بوستر عليك
            <br />
            <span className="text-gradient">الباقي علينا</span>
          </h2>
          <p className="text-muted text-lg mb-8">
            ابدأ الآن وشوف الفرق بنفسك.
          </p>

          {!isAuthenticated ? (
            AUTH_ENABLED ? (
              <SignInButton forceRedirectUrl="/create">
                <motion.button
                  whileTap={TAP_SCALE}
                  className="px-10 py-5 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold text-xl shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
                >
                  ابدأ مجاناً الآن
                </motion.button>
              </SignInButton>
            ) : (
              <Link
                href="/create"
                className="inline-block px-10 py-5 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold text-xl shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all"
              >
                ابدأ الآن
              </Link>
            )
          ) : (
            <motion.button
              whileTap={TAP_SCALE}
              onClick={() => router.push("/create")}
              className="px-10 py-5 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold text-xl shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
            >
              صمم بوسترك الآن
            </motion.button>
          )}
        </AnimateOnScroll>
      </section>
    </main>
  );
}
