"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  UtensilsCrossed,
  ShoppingCart,
  Store,
  Wrench,
  Shirt,
  Upload,
  Palette,
} from "lucide-react";
import type { Category } from "@/lib/types";
import { ImageUpload } from "../components/image-upload";
import { extractDominantColors } from "@/lib/color-extraction";
import { useLocale } from "@/hooks/use-locale";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  useAuth();
  const { t } = useLocale();

  const CATEGORIES: { id: Category; label: string; icon: typeof UtensilsCrossed; color: string; bg: string }[] = [
    { id: "restaurant", label: t("مطاعم وكافيهات", "Restaurants & Cafes"), icon: UtensilsCrossed, color: "text-orange-400", bg: "bg-orange-500/10" },
    { id: "supermarket", label: t("سوبر ماركت", "Supermarkets"), icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { id: "ecommerce", label: t("متاجر إلكترونية", "E-commerce"), icon: Store, color: "text-violet-400", bg: "bg-violet-500/10" },
    { id: "services", label: t("خدمات", "Services"), icon: Wrench, color: "text-blue-400", bg: "bg-blue-500/10" },
    { id: "fashion", label: t("أزياء وموضة", "Fashion"), icon: Shirt, color: "text-pink-400", bg: "bg-pink-500/10" },
    { id: "beauty", label: t("تجميل وعناية", "Beauty & Care"), icon: Sparkles, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
  ];

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
    setStep(2);
  };

  const handleBusinessNameNext = () => {
    if (businessName.trim()) {
      setStep(3);
    }
  };

  const handleLogoChange = async (dataUrl: string | null) => {
    setLogo(dataUrl);
    if (dataUrl) {
      setIsExtracting(true);
      try {
        const colors = await extractDominantColors(dataUrl, 5);
        setExtractedColors(colors);
      } catch {
        setExtractedColors([]);
      } finally {
        setIsExtracting(false);
      }
    } else {
      setExtractedColors([]);
    }
  };

  const handleLogoNext = () => {
    if (logo) {
      setStep(4);
    }
  };

  const handleColorsNext = () => {
    setStep(5);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/users/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessCategory: selectedCategory!,
          brandColors: extractedColors,
        }),
      });
      router.push("/create");
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      router.push("/create");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-grid-pattern relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-xl w-full relative z-10">
        <div className="bg-surface-1/80 backdrop-blur-xl border border-card-border shadow-xl rounded-3xl p-8 md:p-10 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  step > i ? "w-8 bg-primary" : step === i + 1 ? "w-6 bg-primary/50" : "w-2 bg-surface-2"
                }`}
              />
            ))}
          </div>

          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6 transition-colors"
            >
              <ArrowRight size={16} />
              <span>{t("رجوع", "Back")}</span>
            </button>
          )}

          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Sparkles size={32} className="text-primary animate-pulse" />
              </div>

              <h1 className="text-3xl font-bold text-foreground">
                {t("مرحباً بك في", "Welcome to")} <span className="text-gradient-primary">Postaty AI</span>
              </h1>

              <p className="text-muted text-lg leading-relaxed">
                {t("ما هو نوع نشاطك التجاري؟", "What is your business type?")}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`group flex flex-col items-center gap-3 p-4 rounded-xl border border-card-border hover:border-primary/30 hover:bg-surface-2 transition-all ${
                        selectedCategory === cat.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className={`p-3 rounded-lg ${cat.bg} group-hover:scale-110 transition-transform`}>
                        <Icon size={24} className={cat.color} />
                      </div>
                      <span className="font-bold text-sm text-foreground">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Store size={32} className="text-primary" />
              </div>

              <h1 className="text-2xl font-bold text-foreground">
                {t("ما اسم نشاطك التجاري؟", "What is your business name?")}
              </h1>

              <p className="text-muted leading-relaxed">
                {t("سنستخدم هذا الاسم تلقائياً في تصاميمك", "We will use this name automatically in your designs")}
              </p>

              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={t("مثال: مطعم الشام، متجر نون...", "Example: Nova Cafe, Bright Store...")}
                className="w-full px-5 py-4 bg-surface-2 border border-card-border rounded-xl text-foreground text-center text-lg font-bold placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleBusinessNameNext()}
              />

              <button
                onClick={handleBusinessNameNext}
                disabled={!businessName.trim()}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t("التالي", "Next")}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Upload size={32} className="text-primary" />
              </div>

              <h1 className="text-2xl font-bold text-foreground">
                {t("ارفع لوجو نشاطك", "Upload your logo")}
              </h1>

              <p className="text-muted leading-relaxed">
                {t("سنستخرج ألوان علامتك التجارية تلقائياً", "We will extract your brand colors automatically")}
              </p>

              <div className="max-w-xs mx-auto">
                <ImageUpload label={t("لوجو النشاط", "Business logo")} value={logo} onChange={handleLogoChange} />
              </div>

              {isExtracting && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span>{t("جاري استخراج الألوان...", "Extracting colors...")}</span>
                </div>
              )}

              <button
                onClick={handleLogoNext}
                disabled={!logo || isExtracting}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t("التالي", "Next")}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Palette size={32} className="text-primary" />
              </div>

              <h1 className="text-2xl font-bold text-foreground">
                {t("ألوان علامتك التجارية", "Your brand colors")}
              </h1>

              <p className="text-muted leading-relaxed">
                {t("هذه الألوان تم استخراجها من اللوجو وسنستخدمها في تصاميمك", "These colors were extracted from your logo and will be used in your designs")}
              </p>

              {extractedColors.length > 0 ? (
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {extractedColors.map((color) => (
                    <div key={color} className="text-center">
                      <div className="w-12 h-12 rounded-xl border border-card-border mb-1" style={{ backgroundColor: color }} />
                      <span className="text-xs text-muted font-mono" dir="ltr">{color}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">{t("لم يتم استخراج ألوان. يمكنك المتابعة بدون ألوان.", "No colors extracted. You can continue without colors.")}</p>
              )}

              <button
                onClick={handleColorsNext}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
              >
                {t("التالي", "Next")}
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-2">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>

              <h1 className="text-2xl font-bold text-foreground">
                {t("أنت جاهز للبدء!", "You are ready to start!")}
              </h1>

              <div className="bg-surface-2 rounded-xl p-4 space-y-3 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-muted text-sm">{t("النشاط", "Category")}</span>
                  <span className="font-bold">{CATEGORIES.find((c) => c.id === selectedCategory)?.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted text-sm">{t("الاسم", "Name")}</span>
                  <span className="font-bold">{businessName}</span>
                </div>
                {extractedColors.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-sm">{t("الألوان", "Colors")}</span>
                    <div className="flex gap-1.5">
                      {extractedColors.slice(0, 5).map((color) => (
                        <div key={color} className="w-5 h-5 rounded-full border border-card-border" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted leading-relaxed">
                {t("سنملأ هذه البيانات تلقائياً في كل تصميم جديد.", "We will auto-fill this data in every new design.")}
              </p>

              <button
                onClick={handleFinish}
                disabled={isSaving}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? (
                  <span className="inline-flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t("جاري الحفظ...", "Saving...")}</span>
                  </span>
                ) : (
                  <span>{t("ابدأ التصميم الآن", "Start designing now")}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
