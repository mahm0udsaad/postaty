"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDevIdentity } from "@/hooks/use-dev-identity";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles, LayoutGrid, LogIn, AlertCircle } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import dynamic from "next/dynamic";

// Components
import { CategorySelector } from "../components/category-selector";

// Types & Libs
import type { Category, PostFormData, PosterResult, PosterGenStep } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";
import type { GenerationUsage } from "@/lib/generate-designs";
import { CATEGORY_LABELS, FORMAT_CONFIGS } from "@/lib/constants";
import { CATEGORY_THEMES } from "@/lib/category-themes";
import { generatePosters } from "../actions-v2";
import { TAP_SCALE } from "@/lib/animation";

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
  );
}

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { orgId, isLoading: isIdentityLoading } = useDevIdentity();

  // State
  const [category, setCategory] = useState<Category | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState<PosterGenStep>("idle");
  const [results, setResults] = useState<PosterResult[]>([]);
  const [giftResult, setGiftResult] = useState<PosterResult | null>(null);
  const [error, setError] = useState<string>();
  const [lastSubmittedData, setLastSubmittedData] = useState<PostFormData | null>(null);
  const [defaultLogo, setDefaultLogo] = useState<string | null>(null);
  const generatingRef = useRef(false);

  // Get category theme
  const theme = category ? CATEGORY_THEMES[category] : null;

  // Initialize category from URL if present
  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam && ALL_CATEGORIES.includes(catParam as Category)) {
      setCategory(catParam as Category);
    }
  }, [searchParams]);

  const AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  // Billing
  const creditState = useQuery(
    api.billing.getCreditState,
    isAuthenticated ? {} : "skip"
  );
  const canGenerate = creditState?.canGenerate ?? false;
  const consumeCredit = useMutation(api.billing.consumeGenerationCredit);

  // Data Fetching
  const createGeneration = useMutation(api.generations.create);
  const updateStatus = useMutation(api.generations.updateStatus);
  const updateOutput = useMutation(api.generations.updateOutput);
  const generateUploadUrl = useMutation(api.generations.generateUploadUrl);
  const savePosterTemplate = useMutation(api.posterTemplates.save);
  const recordUsageBatch = useMutation(api.aiUsage.recordUsageBatch);

  const defaultBrandKit = useQuery(
    api.brandKits.getDefault,
    isAuthenticated && orgId ? {} : "skip"
  );

  const brandKitPromptData: BrandKitPromptData | undefined = defaultBrandKit
    ? {
        palette: defaultBrandKit.palette,
        styleAdjectives: defaultBrandKit.styleAdjectives,
        doRules: defaultBrandKit.doRules,
        dontRules: defaultBrandKit.dontRules,
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
    if (!AUTH_ENABLED || isAuthLoading || !isAuthenticated || isIdentityLoading) {
      return;
    }

    if (creditState === undefined) {
      return;
    }

    if ("planKey" in creditState && creditState.planKey === "none") {
      router.replace("/pricing");
      return;
    }

  }, [
    AUTH_ENABLED,
    isAuthLoading,
    isAuthenticated,
    isIdentityLoading,
    creditState,
    router,
  ]);

  const persistUsageEvents = async (usages: GenerationUsage[]) => {
    if (usages.length === 0) return;
    try {
      await recordUsageBatch({
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
      setGiftResult(null);
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

  const runGeneration = async (data: PostFormData) => {
    if (generatingRef.current) return;

    // Gate: must have credits
    if (!canGenerate) {
      setError("لا يوجد لديك رصيد كافٍ. يرجى ترقية اشتراكك أو شراء رصيد إضافي.");
      return;
    }

    generatingRef.current = true;
    setLastSubmittedData(data);
    setGenStep("generating-designs");
    setError(undefined);
    setIsGenerating(true);
    setResults([]);
    setGiftResult(null);

    const startTime = getNowMs();
    const idempotencyKey = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // Consume credit BEFORE calling the expensive AI generation
    try {
      const creditResult = await consumeCredit({ idempotencyKey });
      if (!creditResult.ok) {
        throw new Error("لا يوجد لديك رصيد كافٍ");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "فشل خصم الرصيد";
      setError(msg);
      setGenStep("error");
      setIsGenerating(false);
      generatingRef.current = false;
      return;
    }

    generatePosters(data, brandKitPromptData)
      .then(({ main: posterResult, gift, usages }) => {
        void persistUsageEvents(usages);
        setResults([posterResult]);
        if (gift) setGiftResult(gift);
        setGenStep("complete");
        setIsGenerating(false);
        generatingRef.current = false;

        if (posterResult.status === "complete" && posterResult.imageBase64) {
          saveToConvex(data, posterResult, startTime);
        }
      })
      .catch((err) => {
        const errorResult: PosterResult = {
          designIndex: 0,
          format: data.formats[0],
          html: "",
          status: "error",
          error: err instanceof Error ? err.message : "Generation failed",
          designName: "Design",
          designNameAr: "تصميم",
        };
        setResults([errorResult]);
        setGenStep("error");
        setError(err instanceof Error ? err.message : "Generation failed");
        setIsGenerating(false);
        generatingRef.current = false;
      });
  };

  const saveToConvex = async (
    data: PostFormData,
    posterResult: PosterResult,
    startTime: number
  ) => {
    try {
      const generationId = await createGeneration({
        brandKitId: defaultBrandKit?._id,
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
        formats: data.formats,
        creditsCharged: 1,
      });

      const format = data.formats[0];
      const formatConfig = FORMAT_CONFIGS[format];

      const base64Data = posterResult.imageBase64!.includes(",")
        ? posterResult.imageBase64!.split(",")[1]
        : posterResult.imageBase64!;
      const mimeType = posterResult.imageBase64!.includes(",")
        ? posterResult.imageBase64!.split(",")[0].split(":")[1].split(";")[0]
        : "image/png";

      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });

      const uploadUrl = await generateUploadUrl();
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type || "image/png" },
        body: blob,
      });
      const { storageId } = await uploadRes.json();

      await updateOutput({
        generationId,
        format,
        storageId,
        width: formatConfig.width,
        height: formatConfig.height,
      });

      await updateStatus({
        generationId,
        status: "complete",
        durationMs: getNowMs() - startTime,
      });
    } catch (saveErr) {
      console.error("Failed to save generation:", saveErr);
    }
  };

  const handleSaveAsTemplate = async (designIndex: number) => {
    const result = results.find((item) => item.designIndex === designIndex);
    if (!result || result.status !== "complete") return;

    try {
      await savePosterTemplate({
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
      });
    } catch (err) {
      console.error("Failed to save template:", err);
    }
  };

  if (isAuthLoading || (isAuthenticated && isIdentityLoading)) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-surface-2 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-surface-2 rounded"></div>
        </div>
    </div>;
  }

  if (!isAuthenticated && AUTH_ENABLED) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <LogIn size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">سجّل دخولك للمتابعة</h2>
          <p className="text-muted">يجب تسجيل الدخول لإنشاء تصاميم جديدة</p>
          <SignInButton forceRedirectUrl="/create">
            <button className="px-8 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
              تسجيل الدخول
            </button>
          </SignInButton>
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
                {results.length > 0 ? "نتائج التصميم" : category ? "تفاصيل الإعلان" : "إنشاء جديد"}
             </h1>
          </div>

          {category && !results.length && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: `${CATEGORY_THEMES[category].accent}15`, color: CATEGORY_THEMES[category].accent }}
            >
                <Sparkles size={12} />
                <span>{CATEGORY_LABELS[category]}</span>
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
                    <h2 className="text-3xl font-black text-foreground mb-3">ماذا تريد أن تصمم اليوم؟</h2>
                    <p className="text-muted text-lg">اختر نوع نشاطك التجاري للبدء في تصميم إعلانك</p>
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
                        giftResult={giftResult}
                        genStep={genStep}
                        error={error}
                        totalExpected={1}
                        onSaveAsTemplate={handleSaveAsTemplate}
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
                        <span>إنشاء صورة إضافية بنفس المحتوى</span>
                    </motion.button>
                    <motion.button
                        whileTap={TAP_SCALE}
                        onClick={() => { setResults([]); setGenStep("idle"); }}
                        className="flex items-center gap-2 px-6 py-3 bg-surface-1 border border-card-border text-foreground rounded-xl hover:bg-surface-2 font-medium transition-colors"
                    >
                        <LayoutGrid size={18} />
                        <span>تصميم آخر</span>
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
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle size={20} className="shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">لا يوجد لديك رصيد كافٍ</p>
                      <p className="text-xs mt-0.5 opacity-80">يرجى ترقية اشتراكك أو شراء رصيد إضافي للمتابعة</p>
                    </div>
                    <Link
                      href="/pricing"
                      className="shrink-0 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors"
                    >
                      ترقية الاشتراك
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
