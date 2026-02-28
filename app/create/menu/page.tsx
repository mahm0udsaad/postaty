"use client";

import { useState, useRef, Suspense } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles, LayoutGrid, LogIn, AlertCircle, UtensilsCrossed, ShoppingCart } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLocale } from "@/hooks/use-locale";

import type { MenuFormData, MenuCategory, PosterResult, PosterGenStep, MarketingContentHub as MarketingContentHubType, MarketingContentStatus } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";
import type { GenerationUsage } from "@/lib/generate-designs";
import { MENU_CONFIG, MENU_FORMAT_CONFIG } from "@/lib/constants";
import { generateMenuAction, generateMenuMarketingContentAction } from "../../actions-menu";
import { TAP_SCALE } from "@/lib/animation";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error("API error");
  return r.json();
});

const PosterGrid = dynamic(
  () => import("../../components/poster-grid").then((mod) => mod.PosterGrid)
);

const MenuForm = dynamic(
  () => import("../../components/forms/menu-form").then((mod) => mod.MenuForm),
  { loading: () => <FormLoadingFallback /> }
);

const MarketingContentHub = dynamic(
  () => import("../../components/marketing-content-hub").then((mod) => mod.MarketingContentHub)
);

function getNowMs(): number {
  return Date.now();
}

async function urlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch logo");
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read logo"));
    reader.readAsDataURL(blob);
  });
}

function FormLoadingFallback() {
  return (
    <div className="rounded-2xl border border-card-border bg-surface-1 p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-1/3 rounded bg-surface-2" />
        <div className="h-11 rounded bg-surface-2" />
        <div className="h-11 rounded bg-surface-2" />
        <div className="h-40 rounded bg-surface-2" />
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-surface-2 rounded-full mb-4" />
          <div className="h-4 w-32 bg-surface-2 rounded" />
        </div>
      </div>
    }>
      <MenuPageContent />
    </Suspense>
  );
}

function MenuPageContent() {
  const router = useRouter();
  const { isSignedIn, isLoaded: isAuthLoaded, userId } = useAuth();
  const { locale, t } = useLocale();

  const toLocalizedErrorMessage = (error: unknown): string => {
    const message = error instanceof Error ? error.message : "";
    if (!message) {
      return t("حدث خطأ أثناء إنشاء التصميم. حاول مرة أخرى.", "An error occurred while generating. Please try again.");
    }
    if (message.includes("لقد تجاوزت الحد المسموح") || /rate limit/i.test(message)) {
      return t("لقد تجاوزت الحد المسموح. حاول مرة أخرى بعد دقيقة.", "You hit the rate limit. Please try again in a minute.");
    }
    if (message.includes("يجب تسجيل الدخول") || /sign in/i.test(message)) {
      return t("يجب تسجيل الدخول لإنشاء تصاميم", "You need to sign in to create designs.");
    }
    if (/validation failed/i.test(message)) {
      return t("البيانات المدخلة غير صحيحة. تحقق من الحقول وحاول مرة أخرى.", "Some inputs are invalid. Please review the fields and try again.");
    }
    if (/generation failed/i.test(message)) {
      return t("فشل إنشاء القائمة. حاول مرة أخرى.", "Menu generation failed. Please try again.");
    }
    return message;
  };

  // State
  const [menuCategory, setMenuCategory] = useState<MenuCategory | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState<PosterGenStep>("idle");
  const [results, setResults] = useState<PosterResult[]>([]);
  const [error, setError] = useState<string>();
  const [lastSubmittedData, setLastSubmittedData] = useState<MenuFormData | null>(null);
  const [defaultLogo, setDefaultLogo] = useState<string | null>(null);
  const generatingRef = useRef(false);
  const [marketingContent, setMarketingContent] = useState<MarketingContentHubType | null>(null);
  const [marketingContentStatus, setMarketingContentStatus] = useState<MarketingContentStatus>("idle");
  const [marketingContentError, setMarketingContentError] = useState<string>();
  const [marketingLanguage, setMarketingLanguage] = useState<string>("auto");

  // Billing
  const { data: creditState, mutate: mutateCreditState } = useSWR(
    isSignedIn ? "/api/billing" : null,
    fetcher
  );
  const canGenerate = creditState?.canGenerate ?? false;
  const totalRemaining = creditState?.totalRemaining ?? 0;

  // Brand kit
  const { data: brandKitsData } = useSWR(
    isSignedIn && userId ? "/api/brand-kits" : null,
    fetcher
  );
  const brandKits = brandKitsData?.brandKits as any[] | undefined;
  const defaultBrandKit = brandKits?.[0];

  const brandKitPromptData: BrandKitPromptData | undefined =
    defaultBrandKit?.palette
      ? {
          palette: defaultBrandKit.palette,
          styleAdjectives: defaultBrandKit.styleAdjectives ?? [],
          doRules: defaultBrandKit.doRules ?? [],
          dontRules: defaultBrandKit.dontRules ?? [],
          styleSeed: defaultBrandKit.styleSeed ?? undefined,
        }
      : undefined;

  // Load default logo from brand kit
  useState(() => {
    if (!defaultBrandKit?.logoUrl) return;
    urlToDataUrl(defaultBrandKit.logoUrl)
      .then((dataUrl) => setDefaultLogo(dataUrl))
      .catch(() => setDefaultLogo(null));
  });

  const persistUsageEvents = async (usages: GenerationUsage[]) => {
    if (usages.length === 0) return;
    try {
      await fetch("/api/ai-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: usages.map((usage) => ({
            route: usage.route,
            model: usage.model,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            imagesGenerated: usage.imagesGenerated,
            durationMs: usage.durationMs,
            success: usage.success,
            error: usage.error,
          })),
        }),
      });
    } catch (usageErr) {
      console.error("Failed to persist AI usage events:", usageErr);
    }
  };

  const fetchMenuMarketingContent = async (data: MenuFormData, lang: string) => {
    setMarketingContentStatus("loading");
    setMarketingContentError(undefined);
    try {
      const result = await generateMenuMarketingContentAction(data, lang);
      if ("error" in result) {
        setMarketingContentStatus("error");
        setMarketingContentError(result.error);
      } else {
        setMarketingContent(result.content);
        setMarketingContentStatus("complete");
        void persistUsageEvents([result.usage]);
      }
    } catch (err) {
      setMarketingContentStatus("error");
      setMarketingContentError(
        err instanceof Error ? err.message : t("فشل إنشاء المحتوى التسويقي", "Failed to generate marketing content")
      );
    }
  };

  const handleGenerateMarketingContent = () => {
    if (!lastSubmittedData || marketingContentStatus === "loading") return;
    fetchMenuMarketingContent(lastSubmittedData, marketingLanguage);
  };

  const handleMarketingLanguageToggle = (lang: string) => {
    if (lang === marketingLanguage) return;
    setMarketingLanguage(lang);
    if (lastSubmittedData && marketingContentStatus !== "idle") {
      fetchMenuMarketingContent(lastSubmittedData, lang);
    }
  };

  const handleBack = () => {
    if (results.length > 0) {
      setResults([]);
      setGenStep("idle");
      setMarketingContent(null);
      setMarketingContentStatus("idle");
      setMarketingContentError(undefined);
    } else if (menuCategory !== null) {
      setMenuCategory(null);
    } else {
      router.push("/create");
    }
  };

  const uploadImageToStorage = async (imageBase64: string): Promise<{ storagePath: string; publicUrl: string }> => {
    const res = await fetch("/api/storage/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64: imageBase64,
        bucket: "generations",
        prefix: "menu",
      }),
    });
    if (!res.ok) throw new Error("Failed to upload image");
    return res.json();
  };

  const saveToSupabase = async (
    data: MenuFormData,
    posterResult: PosterResult,
    startTime: number
  ) => {
    try {
      const createGenerationPromise = fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandKitId: defaultBrandKit?.id,
          category: data.menuCategory,
          businessName: data.businessName,
          productName: `Menu (${data.items.length} items)`,
          inputs: JSON.stringify({
            ...data,
            logo: undefined,
            items: data.items.map((item) => ({
              name: item.name,
              price: item.price,
              image: undefined,
            })),
          }),
          formats: ["a4-portrait"],
          creditsCharged: MENU_CONFIG.creditsPerMenu,
          generationType: "menu",
        }),
      });

      const uploadPromise = uploadImageToStorage(posterResult.imageBase64!);
      const [createRes, uploadResult] = await Promise.all([createGenerationPromise, uploadPromise]);
      if (!createRes.ok) throw new Error("Failed to create generation");
      const { id: generationId } = await createRes.json();
      const { publicUrl } = uploadResult;

      await fetch(`/api/generations/${generationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outputs: [
            {
              format: "a4-portrait",
              url: publicUrl,
              width: MENU_FORMAT_CONFIG.width,
              height: MENU_FORMAT_CONFIG.height,
            },
          ],
          status: "complete",
          duration_ms: getNowMs() - startTime,
        }),
      });
    } catch (saveErr) {
      console.error("Failed to save menu generation:", saveErr);
    }
  };

  const runGeneration = async (data: MenuFormData) => {
    if (generatingRef.current) return;

    window.scrollTo({ top: 0, behavior: "smooth" });

    // Gate: must have enough credits (3 for menu)
    if (!canGenerate || totalRemaining < MENU_CONFIG.creditsPerMenu) {
      setError(t(
        `لا يوجد لديك رصيد كافٍ. تحتاج ${MENU_CONFIG.creditsPerMenu} أرصدة لتصميم القائمة.`,
        `You need at least ${MENU_CONFIG.creditsPerMenu} credits for menu generation.`
      ));
      return;
    }

    generatingRef.current = true;
    setLastSubmittedData(data);
    setGenStep("generating-designs");
    setError(undefined);
    setIsGenerating(true);
    setResults([]);
    setMarketingContent(null);
    setMarketingContentStatus("idle");
    setMarketingContentError(undefined);

    const startTime = getNowMs();
    const idempotencyKey = `menu_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // Consume 3 credits BEFORE calling AI
    try {
      const creditRes = await fetch("/api/billing/consume-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey, amount: MENU_CONFIG.creditsPerMenu }),
      });
      const creditResult = await creditRes.json();
      if (!creditRes.ok || !creditResult.ok) {
        throw new Error(t("لا يوجد لديك رصيد كافٍ", "You don't have enough credits"));
      }
      mutateCreditState();
    } catch (err) {
      const msg = toLocalizedErrorMessage(err);
      setError(msg);
      setGenStep("error");
      setIsGenerating(false);
      generatingRef.current = false;
      return;
    }

    generateMenuAction(data, brandKitPromptData)
      .then(({ main: menuResult, usages }) => {
        void persistUsageEvents(usages);
        setResults([menuResult]);
        setGenStep("complete");
        setIsGenerating(false);
        generatingRef.current = false;

        if (menuResult.status === "complete" && menuResult.imageBase64) {
          saveToSupabase(data, menuResult, startTime);
        }
      })
      .catch((err) => {
        const localizedMessage = toLocalizedErrorMessage(err);
        const errorResult: PosterResult = {
          designIndex: 0,
          format: "instagram-square",
          html: "",
          status: "error",
          error: localizedMessage,
          designName: "Menu Design",
          designNameAr: "تصميم قائمة",
        };
        setResults([errorResult]);
        setGenStep("error");
        setError(localizedMessage);
        setIsGenerating(false);
        generatingRef.current = false;
      });
  };

  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-surface-2 rounded-full mb-4" />
          <div className="h-4 w-32 bg-surface-2 rounded" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <LogIn size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t("سجّل دخولك للمتابعة", "Sign in to continue")}</h2>
          <p className="text-muted">{t("يجب تسجيل الدخول لإنشاء تصاميم جديدة", "You need to sign in to create new designs")}</p>
          <Link href="/sign-in?redirect_url=/create/menu">
            <button className="px-8 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
              {t("تسجيل الدخول", "Sign in")}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const formDisabled = isGenerating || !canGenerate;
  const sharedDefaultValues = {
    businessName: defaultBrandKit?.name,
    logo: defaultLogo,
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-surface-1 border-b border-card-border sticky top-0 z-40 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={TAP_SCALE}
              onClick={handleBack}
              className="p-2 -mr-2 rounded-full hover:bg-surface-2 text-muted transition-colors"
            >
              <ArrowRight size={20} />
            </motion.button>
            <h1 className="text-lg font-bold text-foreground">
              {results.length > 0
                ? t("نتائج القائمة", "Menu results")
                : menuCategory === null
                ? t("تصميم قائمة", "Design menu")
                : t(
                    menuCategory === "restaurant" ? "قائمة مطعم / كافيه" : "كتالوج سوبر ماركت",
                    menuCategory === "restaurant" ? "Restaurant / Cafe menu" : "Supermarket catalog"
                  )}
            </h1>
          </div>
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "rgb(245, 158, 11)" }}
          >
            <LayoutGrid size={12} />
            <span>{t("قائمة / كتالوج", "Menu / Catalog")}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {(results.length > 0 || isGenerating) ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="bg-surface-1 rounded-3xl p-1 shadow-sm border border-card-border">
                <PosterGrid
                  results={results}
                  genStep={genStep}
                  error={error}
                  totalExpected={1}
                  onGenerateMore={() => {
                    if (!lastSubmittedData || isGenerating || !canGenerate) return;
                    void runGeneration(lastSubmittedData);
                  }}
                  generateMoreLabel={t("إنشاء قائمة إضافية بنفس المحتوى", "Create another menu with same content")}
                  onReset={() => {
                    setResults([]);
                    setGenStep("idle");
                    setMarketingContent(null);
                    setMarketingContentStatus("idle");
                    setMarketingContentError(undefined);
                  }}
                  canGenerateMore={!!lastSubmittedData && !isGenerating && canGenerate && totalRemaining >= MENU_CONFIG.creditsPerMenu}
                />
              </div>

              {genStep === "complete" && results.length > 0 && results[0].status === "complete" && (
                <MarketingContentHub
                  content={marketingContent}
                  status={marketingContentStatus}
                  posterImageBase64={results[0].imageBase64}
                  businessName={lastSubmittedData?.businessName}
                  onGenerate={handleGenerateMarketingContent}
                  onLanguageToggle={handleMarketingLanguageToggle}
                  onRetry={handleGenerateMarketingContent}
                  error={marketingContentError}
                />
              )}
            </motion.div>
          ) : menuCategory === null ? (
            /* ── Step 1: Business type selection ── */
            <motion.div
              key="type-select"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {t("ما نوع نشاطك التجاري؟", "What type of business do you have?")}
                </h2>
                <p className="text-muted text-sm">
                  {t("اختر نوع النشاط لنصمم قائمة مناسبة لك", "Select your business type so we can design the right menu for you")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <button
                  type="button"
                  onClick={() => setMenuCategory("restaurant")}
                  className="group flex flex-col items-center gap-5 p-8 rounded-3xl border-2 border-card-border bg-surface-1 hover:border-primary/60 hover:bg-primary/5 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="w-20 h-20 rounded-2xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                    <UtensilsCrossed size={36} className="text-orange-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{t("مطعم / كافيه", "Restaurant / Cafe")}</p>
                    <p className="text-sm text-muted mt-1">{t("وجبات، مشروبات، حلويات...", "Meals, drinks, desserts...")}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMenuCategory("supermarket")}
                  className="group flex flex-col items-center gap-5 p-8 rounded-3xl border-2 border-card-border bg-surface-1 hover:border-primary/60 hover:bg-primary/5 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="w-20 h-20 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                    <ShoppingCart size={36} className="text-green-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{t("سوبر ماركت", "Supermarket")}</p>
                    <p className="text-sm text-muted mt-1">{t("بقالة، منتجات، عروض...", "Groceries, products, offers...")}</p>
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── Step 2: Fill in form ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto space-y-4"
            >
              {/* No credits banner */}
              {creditState && (!canGenerate || totalRemaining < MENU_CONFIG.creditsPerMenu) && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle size={20} className="shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">
                      {t(
                        `تحتاج ${MENU_CONFIG.creditsPerMenu} أرصدة على الأقل لتصميم القائمة`,
                        `You need at least ${MENU_CONFIG.creditsPerMenu} credits for menu generation`
                      )}
                    </p>
                    <p className="text-xs mt-0.5 opacity-80">
                      {t("يرجى ترقية اشتراكك أو شراء رصيد إضافي للمتابعة", "Please upgrade your plan or buy additional credits to continue")}
                    </p>
                  </div>
                  <Link
                    href="/pricing"
                    className="shrink-0 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors"
                  >
                    {t("ترقية الاشتراك", "Upgrade plan")}
                  </Link>
                </div>
              )}

              <div className="bg-surface-1 rounded-3xl p-6 md:p-10 shadow-xl border border-amber-500/20">
                <MenuForm
                  menuCategory={menuCategory}
                  onSubmit={runGeneration}
                  isLoading={formDisabled}
                  defaultValues={sharedDefaultValues}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
