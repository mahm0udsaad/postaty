"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LogIn, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useLocale } from "@/hooks/use-locale";

// Components
import { CategorySelector } from "../components/category-selector";

// Types & Libs
import type { Category, CampaignType, PostFormData, PosterResult, PosterGenStep, MarketingContentHub as MarketingContentHubType, MarketingContentStatus } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";
import type { GenerationUsage } from "@/lib/generate-designs";
import { CATEGORY_LABELS, FORMAT_CONFIGS } from "@/lib/constants";
import { CATEGORY_THEMES } from "@/lib/category-themes";
import { generatePosters, generateMarketingContentAction, prewarmGenerationAssets } from "../actions-v2";
import { TAP_SCALE } from "@/lib/animation";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

const PosterGrid = dynamic(
  () => import("../components/poster-grid").then((mod) => mod.PosterGrid)
);

const MarketingContentHub = dynamic(
  () => import("../components/marketing-content-hub").then((mod) => mod.MarketingContentHub)
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

const GEN_PREWARM_ENABLED = process.env.NEXT_PUBLIC_GEN_PREWARM !== "0";
const GEN_EARLY_PERSIST_ENABLED = process.env.NEXT_PUBLIC_GEN_EARLY_PERSIST !== "0";
const TIMELINE_VERBOSE = process.env.NODE_ENV !== "production";
const PREWARM_DEBOUNCE_MS = 600;
const NETWORK_TIMEOUT_MS = 15_000;
const PERSIST_RETRY_ATTEMPTS = 2;

type PrewarmHint = {
  campaignType: CampaignType;
  subType?: string;
};

type BrandKitSummary = {
  id?: string;
  name?: string;
  logoUrl?: string;
  palette?: BrandKitPromptData["palette"];
  styleAdjectives?: string[];
  doRules?: string[];
  dontRules?: string[];
  styleSeed?: string;
};

type GenerationTimingEvent =
  | "credit.consume.start"
  | "credit.consume.end"
  | "server.generate.start"
  | "server.generate.end"
  | "ui.result.rendered"
  | "persistence.complete"
  | "persistence.error";

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = PERSIST_RETRY_ATTEMPTS,
  delayMs = 400
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}

async function fetchWithTimeout(input: string, init?: RequestInit, timeoutMs = NETWORK_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
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
  const [error, setError] = useState<string>();
  const [lastSubmittedData, setLastSubmittedData] = useState<PostFormData | null>(null);
  const [marketingContent, setMarketingContent] = useState<MarketingContentHubType | null>(null);
  const [marketingContentStatus, setMarketingContentStatus] = useState<MarketingContentStatus>("idle");
  const [marketingContentError, setMarketingContentError] = useState<string>();
  const [marketingLanguage, setMarketingLanguage] = useState<string>("auto");
  const [defaultLogo, setDefaultLogo] = useState<string | null>(null);
  const generatingRef = useRef(false);
  const prewarmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prewarmedKeysRef = useRef<Set<string>>(new Set());

  // Get category theme
  const theme = category ? CATEGORY_THEMES[category] : null;

  // Initialize category from URL if present
  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam && ALL_CATEGORIES.includes(catParam as Category)) {
      setCategory(catParam as Category);
      return;
    }
    setCategory(null);
  }, [searchParams]);

  // Billing
  const { data: creditState, mutate: mutateCreditState } = useSWR(
    isSignedIn ? '/api/billing' : null,
    fetcher
  );
  const canGenerate = creditState?.canGenerate ?? false;

  // Brand kit
  const { data: brandKitsData } = useSWR(
    isSignedIn && userId ? '/api/brand-kits' : null,
    fetcher
  );
  const brandKits = brandKitsData?.brandKits as BrandKitSummary[] | undefined;
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

  const logTimeline = useCallback((
    requestId: string,
    event: GenerationTimingEvent,
    extra?: Record<string, unknown>
  ) => {
    const payload = {
      requestId,
      event,
      ts: getNowMs(),
      ...(extra ?? {}),
    };
    if (TIMELINE_VERBOSE) {
      console.info("[create.timeline]", payload);
      return;
    }
    console.info("[create.timeline]", { requestId, event });
  }, []);

  const schedulePrewarm = useCallback((hint: PrewarmHint) => {
    if (!GEN_PREWARM_ENABLED || !category || !isSignedIn) return;

    const key = `${category}|${hint.campaignType}|${hint.subType ?? ""}`;
    if (prewarmedKeysRef.current.has(key)) return;

    if (prewarmTimerRef.current) {
      clearTimeout(prewarmTimerRef.current);
    }

    prewarmTimerRef.current = setTimeout(() => {
      void prewarmGenerationAssets({
        category,
        campaignType: hint.campaignType,
        subType: hint.subType,
      })
        .then(() => {
          prewarmedKeysRef.current.add(key);
        })
        .catch(() => {
          // Prewarm must stay non-blocking for UX.
        });
    }, PREWARM_DEBOUNCE_MS);
  }, [category, isSignedIn]);

  useEffect(() => {
    return () => {
      if (prewarmTimerRef.current) {
        clearTimeout(prewarmTimerRef.current);
      }
    };
  }, []);

  // Marketing content generation (called after poster completes)
  const fetchMarketingContent = async (data: PostFormData, lang: string) => {
    setMarketingContentStatus("loading");
    setMarketingContentError(undefined);
    try {
      const result = await generateMarketingContentAction(data, lang);
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

  const handleMarketingLanguageToggle = (lang: string) => {
    if (lang === marketingLanguage) return;
    setMarketingLanguage(lang);
    if (lastSubmittedData && marketingContentStatus !== "idle") {
      fetchMarketingContent(lastSubmittedData, lang);
    }
  };

  const handleGenerateMarketingContent = () => {
    if (!lastSubmittedData || marketingContentStatus === "loading") return;
    fetchMarketingContent(lastSubmittedData, marketingLanguage);
  };

  const resetGenerationContext = useCallback(() => {
    setResults([]);
    setError(undefined);
    setIsGenerating(false);
    setGenStep("idle");
    setLastSubmittedData(null);
    setMarketingContent(null);
    setMarketingContentStatus("idle");
    setMarketingContentError(undefined);
    generatingRef.current = false;
  }, []);

  // Handlers
  const handleCategorySelect = (cat: Category) => {
    resetGenerationContext();
    setCategory(cat);
    prewarmedKeysRef.current.clear();
    router.replace(`/create?category=${cat}`, { scroll: false });

    // Eagerly pre-warm inspiration images for the default campaign type
    if (GEN_PREWARM_ENABLED && isSignedIn) {
      void prewarmGenerationAssets({ category: cat, campaignType: "standard" })
        .then(() => { prewarmedKeysRef.current.add(`${cat}|standard|`); })
        .catch(() => {});
    }
  };

  const handlePrewarmHint = (hint: PrewarmHint) => {
    schedulePrewarm(hint);
  };

  const handleBack = () => {
    if (results.length > 0) {
      resetGenerationContext();
    } else if (category) {
      setCategory(null);
      router.replace("/create", { scroll: false });
    } else {
      router.push("/");
    }
  };

  const runGeneration = async (data: PostFormData) => {
    if (generatingRef.current) return;

    window.scrollTo({ top: 0, behavior: "smooth" });

    // Gate: must have credits
    if (!canGenerate) {
      setError(t("لا يوجد لديك رصيد كافٍ. يرجى ترقية اشتراكك أو شراء رصيد إضافي.", "You don't have enough credits. Please upgrade your plan or buy additional credits."));
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
    const requestId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const idempotencyKey = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // Run credit consumption AND server-side generation in parallel.
    // The server action does auth/validation/image-prep (~500ms) before the
    // expensive AI call, so overlapping credit check with that prep saves time.
    logTimeline(requestId, "credit.consume.start");
    const creditPromise = fetchWithTimeout('/api/billing/consume-credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idempotencyKey }),
    }).then(async (res) => {
      const body = await res.json();
      if (!res.ok || !body.ok) {
        throw new Error(t("لا يوجد لديك رصيد كافٍ", "You don't have enough credits"));
      }
      logTimeline(requestId, "credit.consume.end");
      mutateCreditState();
    });

    let generationId: string | undefined;
    if (GEN_EARLY_PERSIST_ENABLED) {
      generationId = await createGenerationRecord(data);
    }

    logTimeline(requestId, "server.generate.start");
    const generationPromise = generatePosters(data, brandKitPromptData);

    // Wait for credit to succeed first — abort if it fails
    try {
      await creditPromise;
    } catch (err) {
      const msg = toLocalizedErrorMessage(err);
      setError(msg);
      setGenStep("error");
      setIsGenerating(false);
      generatingRef.current = false;
      // Generation is already in-flight but its result will be discarded
      generationPromise.catch(() => {}); // suppress unhandled rejection
      return;
    }

    generationPromise
      .then(({ main: posterResult, usages }) => {
        logTimeline(requestId, "server.generate.end");
        void persistUsageEvents(usages);
        setResults([posterResult]);
        logTimeline(requestId, "ui.result.rendered", { status: posterResult.status });
        setGenStep("complete");
        setIsGenerating(false);
        generatingRef.current = false;

        if (posterResult.status === "complete" && posterResult.imageBase64) {
          void saveToSupabase(data, posterResult, startTime, requestId, generationId);
        }
      })
      .catch((err) => {
        logTimeline(requestId, "server.generate.end", { error: true });
        if (generationId) {
          void patchGenerationStatus(generationId, {
            status: "error",
            error: err instanceof Error ? err.message : "Generation failed",
            duration_ms: getNowMs() - startTime,
          });
        }
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
  };

  const createGenerationRecord = async (data: PostFormData): Promise<string | undefined> => {
    try {
      const res = await fetchWithTimeout('/api/generations', {
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
          formats: [data.format],
          creditsCharged: 1,
          generationType: "poster",
        }),
      });
      if (!res.ok) return undefined;
      const json = await res.json();
      return json?.id as string | undefined;
    } catch {
      return undefined;
    }
  };

  const uploadImageToStorage = async (imageBase64: string): Promise<{ storagePath: string; publicUrl: string }> => {
    return withRetry(async () => {
      const res = await fetchWithTimeout('/api/storage/upload', {
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
    });
  };

  const patchGenerationStatus = async (
    generationId: string,
    updates: Record<string, unknown>
  ): Promise<void> => {
    await withRetry(async () => {
      const res = await fetchWithTimeout(`/api/generations/${generationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to patch generation");
    });
  };

  const saveToSupabase = async (
    data: PostFormData,
    posterResult: PosterResult,
    startTime: number,
    requestId: string,
    generationId?: string
  ) => {
    try {
      const format = data.format;
      const formatConfig = FORMAT_CONFIGS[format];
      let resolvedGenerationId = generationId;
      if (!resolvedGenerationId) {
        resolvedGenerationId = await createGenerationRecord(data);
      }
      if (!resolvedGenerationId) throw new Error("Failed to create generation");

      const uploadResult = await uploadImageToStorage(posterResult.imageBase64!);
      const { publicUrl } = uploadResult;
      await patchGenerationStatus(resolvedGenerationId, {
        outputs: [
          {
            format,
            url: publicUrl,
            width: formatConfig.width,
            height: formatConfig.height,
          },
        ],
        status: 'complete',
        duration_ms: getNowMs() - startTime,
      });
      logTimeline(requestId, "persistence.complete", { generationId: resolvedGenerationId });
    } catch (saveErr) {
      logTimeline(requestId, "persistence.error");
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
        return <RestaurantForm onSubmit={runGeneration} onPrewarmHint={handlePrewarmHint} isLoading={formDisabled} defaultValues={sharedDefaultValues} />;
      case "supermarket":
        return <SupermarketForm onSubmit={runGeneration} onPrewarmHint={handlePrewarmHint} isLoading={formDisabled} defaultValues={sharedDefaultValues} />;
      case "ecommerce":
        return <EcommerceForm onSubmit={runGeneration} onPrewarmHint={handlePrewarmHint} isLoading={formDisabled} defaultValues={sharedDefaultValues} />;
      case "services":
        return <ServicesForm onSubmit={runGeneration} onPrewarmHint={handlePrewarmHint} isLoading={formDisabled} defaultValues={sharedDefaultValues} />;
      case "fashion":
        return <FashionForm onSubmit={runGeneration} onPrewarmHint={handlePrewarmHint} isLoading={formDisabled} defaultValues={sharedDefaultValues} />;
      case "beauty":
        return <BeautyForm onSubmit={runGeneration} onPrewarmHint={handlePrewarmHint} isLoading={formDisabled} defaultValues={sharedDefaultValues} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!category ? (
            <motion.div
                key="category-selection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-foreground mb-3">{t("ماذا تريد أن تصمم اليوم؟", "What do you want to design today?")}</h2>
                    <p className="text-muted text-lg">{t("اختر نوع نشاطك التجاري للبدء في تصميم إعلانك", "Choose your business type to start designing your ad")}</p>
                </div>

                {/* Menu Feature Banner - Premium & Compact */}
                <Link href="/create/menu" className="block mb-8 w-full group outline-none">
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={TAP_SCALE}
                    className="relative overflow-hidden bg-gradient-to-br from-surface-1 to-surface-2 border border-border hover:border-primary/40 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-500"
                  >
                    {/* Subtle Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="flex flex-col sm:flex-row items-stretch relative z-10">
                      
                      {/* Content Side */}
                      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center relative">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                            {t("جديد", "NEW")}
                          </span>
                          <span className="text-xs font-semibold text-primary/80 uppercase tracking-widest">
                            {t("ميزة استثنائية", "Premium Feature")}
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-foreground text-2xl sm:text-3xl mb-2 tracking-tight">
                          {t("تصميم ", "Design ")}
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">
                            {t("قائمة / كتالوج", "Menu / Catalog")}
                          </span>
                        </h3>
                        
                        <p className="text-sm text-muted-foreground font-medium mb-6 max-w-lg leading-relaxed">
                          {t("أضف 4-6 منتجات واحصل على تصميم احترافي جاهز للطباعة والنشر بضغطة زر.", "Add 4-6 products and get a professional print-ready design with one click.")}
                        </p>
                        
                        <div className="flex items-center mt-auto">
                          <div className="flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all">
                            <span>{t("ابدأ التصميم الآن", "Start designing now")}</span>
                            <ArrowRight size={16} className={locale === "ar" ? "rotate-180" : ""} />
                          </div>
                        </div>
                      </div>

                      {/* Visual Side (Integrated & Abstract) */}
                      <div className="w-full sm:w-[40%] md:w-[35%] min-h-[160px] relative flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-t sm:border-t-0 sm:border-l border-border/50 overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl" />
                        
                        {/* Floating Cards Mockup */}
                        <div className="relative w-full max-w-[140px] aspect-[3/4] group-hover:rotate-[-4deg] group-hover:scale-105 transition-all duration-700 z-10 flex items-center justify-center">
                           {/* Back Card */}
                           <div className="absolute inset-0 bg-background/60 backdrop-blur-sm border border-border shadow-lg rounded-xl rotate-12 translate-x-6 transition-transform group-hover:rotate-[16deg] group-hover:translate-x-8" />
                           {/* Middle Card */}
                           <div className="absolute inset-0 bg-background/80 backdrop-blur-md border border-border shadow-xl rounded-xl rotate-6 translate-x-3 transition-transform group-hover:rotate-8 group-hover:translate-x-4" />
                           {/* Front Card */}
                           <div className="relative w-full h-full bg-background border border-border shadow-2xl rounded-xl p-2.5 flex flex-col gap-2 z-20">
                              {/* Mock Header */}
                              <div className="h-6 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                 <div className="w-10 h-1.5 bg-primary/40 rounded-full" />
                              </div>
                              {/* Mock Grid */}
                              <div className="grid grid-cols-2 gap-1.5 flex-1">
                                 {[...Array(4)].map((_, i) => (
                                   <div key={i} className="bg-surface-2 rounded-md border border-border/30 p-1 flex flex-col gap-1">
                                      <div className="flex-1 bg-foreground/5 rounded" />
                                      <div className="h-1 w-full bg-foreground/10 rounded-full" />
                                      <div className="h-1 w-2/3 bg-foreground/10 rounded-full" />
                                   </div>
                                 ))}
                              </div>
                           </div>
                           
                           {/* Sparkle */}
                           <Sparkles size={24} className="absolute -top-4 -right-4 text-amber-500 animate-pulse z-30 drop-shadow-md" />
                        </div>
                      </div>

                    </div>
                  </motion.div>
                </Link>

                <CategorySelector onSelect={handleCategorySelect} />
            </motion.div>
          ) : (results.length > 0 || isGenerating) ? (
            <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
            >
                <div className="flex items-center justify-between mb-4">
                  <motion.button
                      whileTap={TAP_SCALE}
                      onClick={() => setCategory(null)}
                      className="flex items-center gap-2 px-4 py-2 bg-surface-1 border border-card-border rounded-xl text-muted hover:text-foreground hover:bg-surface-2 transition-colors font-medium text-sm"
                  >
                      <ArrowRight size={16} />
                      <span>{t("العودة للتصنيفات", "Back to categories")}</span>
                  </motion.button>
                </div>

                <div className="bg-surface-1 rounded-3xl p-1 shadow-sm border border-card-border">
                    <PosterGrid
                        results={results}
                        genStep={genStep}
                        error={error}
                        totalExpected={1}
                        onSaveAsTemplate={handleSaveAsTemplate}
                        onGenerateMore={() => {
                          if (!lastSubmittedData || isGenerating || !canGenerate) return;
                          void runGeneration(lastSubmittedData);
                        }}
                        onReset={() => { setResults([]); setGenStep("idle"); }}
                        canGenerateMore={!!lastSubmittedData && !isGenerating && canGenerate}
                    />
                </div>

                {/* Marketing Content Hub (replaces Gift) */}
                {genStep === "complete" && results.length > 0 && results[0].status === "complete" && (
                  <MarketingContentHub
                    content={marketingContent}
                    status={marketingContentStatus}
                    posterImageBase64={results[0].imageBase64}
                    businessName={lastSubmittedData ? getBusinessName(lastSubmittedData) : undefined}
                    onGenerate={handleGenerateMarketingContent}
                    onLanguageToggle={handleMarketingLanguageToggle}
                    onRetry={handleGenerateMarketingContent}
                    error={marketingContentError}
                  />
                )}
            </motion.div>
          ) : (
            <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto space-y-4"
            >
                <div className="flex items-center justify-between mb-4">
                  <motion.button
                      whileTap={TAP_SCALE}
                      onClick={() => setCategory(null)}
                      className="flex items-center gap-2 px-4 py-2 bg-surface-1 border border-card-border rounded-xl text-muted hover:text-foreground hover:bg-surface-2 transition-colors font-medium text-sm"
                  >
                      <ArrowRight size={16} />
                      <span>{t("العودة للتصنيفات", "Back to categories")}</span>
                  </motion.button>
                  
                  {category && (
                    <div
                      className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: `${CATEGORY_THEMES[category].accent}15`, color: CATEGORY_THEMES[category].accent }}
                    >
                        <Image src="/icon_logo_svg.svg" alt="postaty" width={12} height={12} className="object-contain" />
                        <span>{locale === "ar" ? CATEGORY_LABELS[category] : CATEGORY_LABELS_EN[category]}</span>
                    </div>
                  )}
                </div>

                {/* No credits banner */}
                {creditState && !canGenerate && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
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
