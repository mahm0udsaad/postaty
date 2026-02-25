"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles, LayoutGrid, LogIn, AlertCircle } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLocale } from "@/hooks/use-locale";

// Components
import { CategorySelector } from "../components/category-selector";
import { ErrorBoundary } from "../components/error-boundary";

// Types & Libs
import type { Category, PostFormData, PosterResult, PosterGenStep, MarketingContent, MarketingContentStatus } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";
import type { GenerationUsage } from "@/lib/generate-designs";
import { CATEGORY_LABELS, FORMAT_CONFIGS } from "@/lib/constants";
import { CATEGORY_THEMES } from "@/lib/category-themes";
import { generatePosters, generateMarketingContentAction, retryMarketingContentAction } from "../actions-v2";
import { TAP_SCALE } from "@/lib/animation";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

const PosterGrid = dynamic(
  () => import("../components/poster-grid").then((mod) => mod.PosterGrid)
);

const RestaurantForm = dynamic(
  () => import("../components/forms/restaurant-form").then((mod) => mod.RestaurantForm),
  { loading: () => <FormLoadingFallback /> }
);
const SupermarketForm = dynamic(
  () => import("../components/forms/supermarket-form").then((mod) => mod.SupermarketForm),
  { loading: () => <FormLoadingFallback /> }
);
const EcommerceForm = dynamic(
  () => import("../components/forms/ecommerce-form").then((mod) => mod.EcommerceForm),
  { loading: () => <FormLoadingFallback /> }
);
const ServicesForm = dynamic(
  () => import("../components/forms/services-form").then((mod) => mod.ServicesForm),
  { loading: () => <FormLoadingFallback /> }
);
const FashionForm = dynamic(
  () => import("../components/forms/fashion-form").then((mod) => mod.FashionForm),
  { loading: () => <FormLoadingFallback /> }
);
const BeautyForm = dynamic(
  () => import("../components/forms/beauty-form").then((mod) => mod.BeautyForm),
  { loading: () => <FormLoadingFallback /> }
);

const ALL_CATEGORIES: Category[] = ["restaurant", "supermarket", "ecommerce", "services", "fashion", "beauty"];
const CATEGORY_LABELS_EN: Record<Category, string> = {
  restaurant: "Restaurants & Cafes",
  supermarket: "Supermarkets",
  ecommerce: "E-commerce",
  services: "Services",
  fashion: "Fashion",
  beauty: "Beauty & Care",
};

function getNowMs(): number {
  return Date.now();
}

async function urlToDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Failed to create canvas context"));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to fetch logo"));
    img.src = url;
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

function getBusinessName(data: PostFormData): string {
  switch (data.category) {
    case "restaurant": return data.restaurantName;
    case "supermarket": return data.supermarketName;
    case "ecommerce": return data.shopName;
    case "services": return data.businessName;
    case "fashion": return data.brandName;
    case "beauty": return data.salonName;
  }
}

function getProductName(data: PostFormData): string {
  switch (data.category) {
    case "restaurant": return data.mealName;
    case "supermarket": return data.productName;
    case "ecommerce": return data.productName;
    case "services": return data.serviceName;
    case "fashion": return data.itemName;
    case "beauty": return data.serviceName;
  }
}

export default function CreatePage() {
  return (
    <ErrorBoundary
      fallbackTitle="Something went wrong"
      fallbackMessage="An unexpected error occurred while loading the create page. Please try again."
    >
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-surface-2 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-surface-2 rounded"></div>
          </div>
        </div>
      }>
        <CreatePageContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded: isAuthLoaded, userId } = useAuth();
  const { locale, t } = useLocale();

  const toLocalizedErrorMessage = (error: unknown): string => {
    const message = error instanceof Error ? error.message : "";
    if (!message) {
      return t("حدث خطأ أثناء إنشاء التصميم. حاول مرة أخرى.", "An error occurred while generating. Please try again.");
    }

    if (
      message.includes("لقد تجاوزت الحد المسموح") ||
      /rate limit/i.test(message)
    ) {
      return t("لقد تجاوزت الحد المسموح. حاول مرة أخرى بعد دقيقة.", "You hit the rate limit. Please try again in a minute.");
    }

    if (
      message.includes("يجب تسجيل الدخول لإنشاء تصاميم") ||
      /sign in/i.test(message)
    ) {
      return t("يجب تسجيل الدخول لإنشاء تصاميم", "You need to sign in to create designs.");
    }

    if (/validation failed/i.test(message)) {
      return t("البيانات المدخلة غير صحيحة. تحقق من الحقول وحاول مرة أخرى.", "Some inputs are invalid. Please review the fields and try again.");
    }

    if (/generation failed/i.test(message)) {
      return t("فشل إنشاء التصميم. حاول مرة أخرى.", "Design generation failed. Please try again.");
    }

    return message;
  };

  // State
  const [category, setCategory] = useState<Category | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState<PosterGenStep>("idle");
  const [results, setResults] = useState<PosterResult[]>([]);
  const [marketingContent, setMarketingContent] = useState<MarketingContent | null>(null);
  const [marketingStatus, setMarketingStatus] = useState<MarketingContentStatus>("idle");
  const [error, setError] = useState<string>();
  const [lastSubmittedData, setLastSubmittedData] = useState<PostFormData | null>(null);
  const [lastPosterRef, setLastPosterRef] = useState<string | null>(null);
  const [defaultLogo, setDefaultLogo] = useState<string | null>(null);
  const generatingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get category theme
  const theme = category ? CATEGORY_THEMES[category] : null;

  // Cleanup: abort in-flight generation on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Initialize category from URL if present
  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam && ALL_CATEGORIES.includes(catParam as Category)) {
      setCategory(catParam as Category);
    }
  }, [searchParams]);

  // Billing
  const { data: creditState, mutate: mutateCreditState } = useSWR(
    isSignedIn ? '/api/billing' : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  const canGenerate = creditState?.canGenerate ?? false;

  // Brand kit
  const { data: brandKitsData } = useSWR(
    isSignedIn && userId ? '/api/brand-kits' : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
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

  useEffect(() => {
    let isCancelled = false;

    if (!defaultBrandKit?.logoUrl) {
      setDefaultLogo(null);
      return;
    }

    urlToDataUrl(defaultBrandKit.logoUrl)
      .then((dataUrl) => {
        if (!isCancelled) setDefaultLogo(dataUrl);
      })
      .catch((err) => {
        console.error("Failed to preload brand logo:", err);
        if (!isCancelled) setDefaultLogo(null);
      });

    return () => {
      isCancelled = true;
    };
  }, [defaultBrandKit?.logoUrl]);

  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn) {
      return;
    }

    if (creditState === undefined) {
      return;
    }

    // Don't redirect while generating or viewing results
    if (isGenerating || results.length > 0) return;

    if ("totalRemaining" in creditState && creditState.totalRemaining < 1) {
      router.replace("/pricing");
      return;
    }

  }, [
    isAuthLoaded,
    isSignedIn,
    creditState,
    isGenerating,
    results.length,
    router,
  ]);

  const persistUsageEvents = async (usages: GenerationUsage[]) => {
    if (usages.length === 0) return;
    try {
      await fetch('/api/ai-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Handlers
  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    const url = new URL(window.location.href);
    url.searchParams.set("category", cat);
    window.history.pushState({}, "", url);
  };

  const handleBack = () => {
    if (results.length > 0) {
      setResults([]);
      setMarketingContent(null);
      setMarketingStatus("idle");
      setGenStep("idle");
    } else if (category) {
      setCategory(null);
      const url = new URL(window.location.href);
      url.searchParams.delete("category");
      window.history.pushState({}, "", url);
    } else {
      router.push("/");
    }
  };

  const runGeneration = useCallback(async (data: PostFormData) => {
    if (generatingRef.current) return;

    // Gate: must have credits
    if (!canGenerate) {
      setError(t("لا يوجد لديك رصيد كافٍ. يرجى ترقية اشتراكك أو شراء رصيد إضافي.", "You don't have enough credits. Please upgrade your plan or buy additional credits."));
      return;
    }

    // Immediately lock to prevent double-submission
    generatingRef.current = true;

    // Abort any in-flight generation
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLastSubmittedData(data);
    setGenStep("generating-designs");
    setError(undefined);
    setIsGenerating(true);
    setResults([]);
    setMarketingContent(null);
    setMarketingStatus("idle");

    const startTime = getNowMs();
    const idempotencyKey = `gen_${Date.now()}_${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)}`;

    // Consume credit BEFORE calling the expensive AI generation
    try {
      const creditRes = await fetch('/api/billing/consume-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idempotencyKey }),
        signal: abortController.signal,
      });
      const creditResult = await creditRes.json();
      if (!creditRes.ok || !creditResult.ok) {
        throw new Error(t("لا يوجد لديك رصيد كافٍ", "You don't have enough credits"));
      }
      mutateCreditState(); // Revalidate credit state
    } catch (err) {
      if (abortController.signal.aborted) return;
      const msg = toLocalizedErrorMessage(err);
      setError(msg);
      setGenStep("error");
      setIsGenerating(false);
      generatingRef.current = false;
      return;
    }

    generatePosters(data, brandKitPromptData)
      .then(({ main: posterResult, usages, posterRef }) => {
        if (abortController.signal.aborted) return;
        void persistUsageEvents(usages);
        setResults([posterResult]);
        setGenStep("complete");
        setIsGenerating(false);
        generatingRef.current = false;

        if (posterResult.status === "complete" && posterResult.imageBase64) {
          saveToSupabase(data, posterResult, null, startTime);

          // Phase 2: poster is visible — now fetch marketing content in background
          if (posterRef) {
            setLastPosterRef(posterRef);
            setMarketingStatus("generating");
            generateMarketingContentAction(posterRef, data)
              .then(({ content, usage }) => {
                if (abortController.signal.aborted) return;
                void persistUsageEvents([usage]);
                setMarketingContent(content);
                setMarketingStatus("complete");
              })
              .catch((err) => {
                if (abortController.signal.aborted) return;
                console.error("Marketing content generation failed:", err);
                setMarketingStatus("error");
              });
          }
        }
      })
      .catch((err) => {
        if (abortController.signal.aborted) return;
        const localizedMessage = toLocalizedErrorMessage(err);
        const errorResult: PosterResult = {
          designIndex: 0,
          format: data.format,
          html: "",
          status: "error",
          error: localizedMessage,
          designName: "Design",
          designNameAr: locale === "ar" ? "تصميم" : "Design",
        };
        setResults([errorResult]);
        setGenStep("error");
        setError(localizedMessage);
        setIsGenerating(false);
        generatingRef.current = false;
      });
  }, [canGenerate, brandKitPromptData, locale, t, mutateCreditState]);

  const uploadImageToStorage = async (imageBase64: string): Promise<{ storagePath: string; publicUrl: string }> => {
    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64: imageBase64,
        bucket: 'generations',
        prefix: 'poster',
      }),
    });
    if (!res.ok) throw new Error('Failed to upload image');
    return res.json();
  };

  const saveToSupabase = async (
    data: PostFormData,
    posterResult: PosterResult,
    _giftPosterResult: PosterResult | null,
    startTime: number
  ) => {
    try {
      const format = data.format;
      const formatConfig = FORMAT_CONFIGS[format];

      // Create generation record
      const createRes = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandKitId: defaultBrandKit?.id,
          category: data.category,
          businessName: getBusinessName(data),
          productName: getProductName(data),
          inputs: JSON.stringify({
            ...data,
            logo: undefined,
            mealImage: undefined,
            productImage: undefined,
            productImages: undefined,
            serviceImage: undefined,
          }),
          formats: [format],
          creditsCharged: 1,
        }),
      });
      if (!createRes.ok) throw new Error('Failed to create generation');
      const { id: generationId } = await createRes.json();

      // Upload main poster
      const { publicUrl } = await uploadImageToStorage(posterResult.imageBase64!);
      await fetch(`/api/generations/${generationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateOutput',
          format,
          imageUrl: publicUrl,
          width: formatConfig.width,
          height: formatConfig.height,
        }),
      });

      await fetch(`/api/generations/${generationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          status: 'complete',
          durationMs: getNowMs() - startTime,
        }),
      });
    } catch (saveErr) {
      console.error("Failed to save generation:", saveErr);
    }
  };

  const handleSaveAsTemplate = async (designIndex: number) => {
    const result = results.find((item) => item.designIndex === designIndex);
    if (!result || result.status !== "complete") return;

    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.designName,
          nameAr: result.designNameAr,
          description: result.designName,
          category: category!,
          style: "modern",
          designJson: JSON.stringify({
            name: result.designName,
            nameAr: result.designNameAr,
            imageBase64: result.imageBase64,
          }),
        }),
      });
    } catch (err) {
      console.error("Failed to save template:", err);
    }
  };

  const handleRetryMarketingContent = useCallback(async () => {
    const posterBase64 = results.find((r) => r.status === "complete")?.imageBase64;
    if (!posterBase64 || !lastSubmittedData) return;

    setMarketingStatus("generating");
    setMarketingContent(null);
    try {
      const { content, usage } = await retryMarketingContentAction(posterBase64, lastSubmittedData);
      void persistUsageEvents([usage]);
      setMarketingContent(content);
      setMarketingStatus("complete");
    } catch (err) {
      console.error("Marketing content retry failed:", err);
      setMarketingStatus("error");
    }
  }, [results, lastSubmittedData]);

  if (!isAuthLoaded) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-surface-2 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-surface-2 rounded"></div>
        </div>
    </div>;
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
          <Link href="/sign-in?redirect_url=/create">
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

  const renderForm = () => {
    switch (category) {
      case "restaurant":
        return <RestaurantForm onSubmit={runGeneration} isLoading={formDisabled} defaultValues={sharedDefaultValues} />;
      case "supermarket":
        return <SupermarketForm onSubmit={runGeneration} isLoading={formDisabled} defaultValues={sharedDefaultValues} />;
      case "ecommerce":
        return <EcommerceForm onSubmit={runGeneration} isLoading={formDisabled} defaultValues={sharedDefaultValues} />;
      case "services":
        return <ServicesForm onSubmit={runGeneration} isLoading={formDisabled} defaultValues={sharedDefaultValues} />;
      case "fashion":
        return <FashionForm onSubmit={runGeneration} isLoading={formDisabled} defaultValues={sharedDefaultValues} />;
      case "beauty":
        return <BeautyForm onSubmit={runGeneration} isLoading={formDisabled} defaultValues={sharedDefaultValues} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header with category accent */}
      <header className="bg-surface-1 border-b border-card-border sticky top-0 z-40 relative overflow-hidden">
        {/* Category accent line */}
        {theme && (
          <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${theme.gradient}`} />
        )}
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
                {results.length > 0 ? t("نتائج التصميم", "Design results") : category ? t("تفاصيل الإعلان", "Ad details") : t("إنشاء جديد", "Create new")}
             </h1>
          </div>

          {category && !results.length && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: `${CATEGORY_THEMES[category].accent}15`, color: CATEGORY_THEMES[category].accent }}
            >
                <Sparkles size={12} />
                <span>{locale === "ar" ? CATEGORY_LABELS[category] : CATEGORY_LABELS_EN[category]}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!category ? (
            <motion.div
                key="category-selection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
            >
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-foreground mb-3">{t("ماذا تريد أن تصمم اليوم؟", "What do you want to design today?")}</h2>
                    <p className="text-muted text-lg">{t("اختر نوع نشاطك التجاري للبدء في تصميم إعلانك", "Choose your business type to start designing your ad")}</p>
                </div>
                <CategorySelector onSelect={handleCategorySelect} />
            </motion.div>
          ) : (results.length > 0 || isGenerating) ? (
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
                        onSaveAsTemplate={handleSaveAsTemplate}
                        marketingContent={marketingContent}
                        marketingStatus={marketingStatus}
                        onRetryMarketingContent={handleRetryMarketingContent}
                        businessName={lastSubmittedData ? getBusinessName(lastSubmittedData) : undefined}
                        businessLogo={lastSubmittedData?.logo ?? defaultLogo ?? undefined}
                    />
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    <motion.button
                        whileTap={TAP_SCALE}
                        onClick={() => {
                          if (!lastSubmittedData || isGenerating || !canGenerate) return;
                          void runGeneration(lastSubmittedData);
                        }}
                        disabled={!lastSubmittedData || isGenerating || !canGenerate}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles size={18} />
                        <span>{t("إنشاء صورة إضافية بنفس المحتوى", "Create another image with the same content")}</span>
                    </motion.button>
                    <motion.button
                        whileTap={TAP_SCALE}
                        onClick={() => { setResults([]); setGenStep("idle"); setMarketingContent(null); setMarketingStatus("idle"); }}
                        className="flex items-center gap-2 px-6 py-3 bg-surface-1 border border-card-border text-foreground rounded-xl hover:bg-surface-2 font-medium transition-colors"
                    >
                        <LayoutGrid size={18} />
                        <span>{t("تصميم آخر", "Another design")}</span>
                    </motion.button>
                </div>
            </motion.div>
          ) : (
            <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto space-y-4"
            >
                {/* No credits banner */}
                {creditState && !canGenerate && (
                  <div role="alert" className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle size={20} className="shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{t("لا يوجد لديك رصيد كافٍ", "You don't have enough credits")}</p>
                      <p className="text-xs mt-0.5 opacity-80">{t("يرجى ترقية اشتراكك أو شراء رصيد إضافي للمتابعة", "Please upgrade your plan or buy additional credits to continue")}</p>
                    </div>
                    <Link
                      href="/pricing"
                      className="shrink-0 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors"
                    >
                      {t("ترقية الاشتراك", "Upgrade plan")}
                    </Link>
                  </div>
                )}

                <div
                  className="bg-surface-1 rounded-3xl p-6 md:p-10 shadow-xl border"
                  style={{ borderColor: theme ? theme.border : "var(--card-border)" }}
                >
                    {renderForm()}
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
