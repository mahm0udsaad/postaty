"use client";

import { HeroVisual } from "./components/hero-visual";
import { useState, useTransition, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Category, PostFormData, PosterResult, PosterGenStep } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CategorySelector } from "./components/category-selector";
import { RestaurantForm } from "./components/forms/restaurant-form";
import { SupermarketForm } from "./components/forms/supermarket-form";
import { OnlineForm } from "./components/forms/online-form";
import { PosterGrid } from "./components/poster-grid";
import { generateSinglePoster } from "./actions-v2";
import { useDevIdentity } from "@/hooks/use-dev-identity";
import { ArrowRight, Sparkles, Palette, ArrowDown } from "lucide-react";

type AppStep =
  | "select-category"
  | "fill-form"
  | "generating"
  | "results";

function getBusinessName(data: PostFormData): string {
  switch (data.category) {
    case "restaurant":
      return data.restaurantName;
    case "supermarket":
      return data.supermarketName;
    case "online":
      return data.shopName;
  }
}

function getProductName(data: PostFormData): string {
  switch (data.category) {
    case "restaurant":
      return data.mealName;
    case "supermarket":
      return data.productName;
    case "online":
      return data.productName;
  }
}

export default function Home() {
  const [step, setStep] = useState<AppStep>("select-category");
  const [category, setCategory] = useState<Category | null>(null);
  const [genStep, setGenStep] = useState<PosterGenStep>("idle");
  const [results, setResults] = useState<PosterResult[]>([]);
  const [error, setError] = useState<string>();
  const [expectedTotal, setExpectedTotal] = useState(4);
  const [batchIndex, setBatchIndex] = useState(0);
  const [lastSubmission, setLastSubmission] = useState<PostFormData | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const { orgId, userId } = useDevIdentity();

  const scrollToCategories = () => {
    document.getElementById("categories-section")?.scrollIntoView({ behavior: "smooth" });
  };

  // Convex mutations for saving
  const createGeneration = useMutation(api.generations.create);
  const updateStatus = useMutation(api.generations.updateStatus);
  const savePosterTemplate = useMutation(api.posterTemplates.save);

  // Fetch default brand kit
  const defaultBrandKit = useQuery(api.brandKits.getDefault, { orgId });

  const brandKitPromptData: BrandKitPromptData | undefined =
    defaultBrandKit
      ? {
          palette: defaultBrandKit.palette,
          styleAdjectives: defaultBrandKit.styleAdjectives,
          doRules: defaultBrandKit.doRules,
          dontRules: defaultBrandKit.dontRules,
          styleSeed: defaultBrandKit.styleSeed ?? undefined,
        }
      : undefined;

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    setStep("fill-form");
  };

  const handleBack = () => {
    if (step === "fill-form") {
      setCategory(null);
      setStep("select-category");
    } else if (step === "results") {
      setResults([]);
      setError(undefined);
      setGenStep("idle");
      setExpectedTotal(4);
      setBatchIndex(0);
      setLastSubmission(null);
      setStep("fill-form");
    }
  };

  const runGeneration = (data: PostFormData, options: { append: boolean }) => {
    const totalPosters = 4;
    const nextBatch = options.append ? batchIndex + 1 : 0;

    setLastSubmission(data);
    setBatchIndex(nextBatch);
    setGenStep("generating-designs");
    setError(undefined);

    if (options.append) {
      setExpectedTotal((prev) => prev + totalPosters);
      setStep("results");
    } else {
      setExpectedTotal(totalPosters);
      setResults([]);
      setStep("generating");
    }

    const startTime = Date.now();

    startTransition(async () => {
      try {
        let completed = 0;
        let successCount = 0;
        const allResults: PosterResult[] = [];

        const recordResult = (result: PosterResult) => {
          console.info("[page] poster_result", {
            designIndex: result.designIndex,
            status: result.status,
            htmlLength: result.html.length,
          });
          setResults((prev) => {
            const next = [...prev, result];
            next.sort((a, b) => a.designIndex - b.designIndex);
            return next;
          });
          allResults.push(result);
          if (result.status === "complete") successCount += 1;
          completed += 1;

          if (completed === totalPosters) {
            setGenStep("complete");
            setStep("results");

            if (successCount > 0) {
              void (async () => {
                try {
                  const generationId = await createGeneration({
                    orgId,
                    userId,
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
                    }),
                    formats: data.formats,
                    creditsCharged: successCount,
                  });

                  await updateStatus({
                    generationId,
                    status: successCount === allResults.length ? "complete" : "partial",
                    durationMs: Date.now() - startTime,
                  });
                } catch (saveErr) {
                  console.error("Failed to save generation to Convex:", saveErr);
                }
              })();
            }
          }
        };

        for (let i = 0; i < totalPosters; i += 1) {
          const styleIndex = nextBatch * totalPosters + i;
          generateSinglePoster(data, styleIndex, brandKitPromptData)
            .then(recordResult)
            .catch((err) => {
              recordResult({
                designIndex: styleIndex,
                format: data.formats[0],
                html: "",
                status: "error",
                error: err instanceof Error ? err.message : "Generation failed",
                designName: `Design ${styleIndex + 1}`,
                designNameAr: `تصميم ${styleIndex + 1}`,
              });
            });
        }
      } catch (err) {
        setGenStep("error");
        setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        setStep("results");
      }
    });
  };

  const handleSubmit = (data: PostFormData) => {
    runGeneration(data, { append: false });
  };

  const handleGenerateMore = () => {
    if (!lastSubmission || isPending || genStep === "generating-designs") return;
    runGeneration(lastSubmission, { append: true });
  };

  const handleSaveAsTemplate = async (designIndex: number) => {
    const result = results.find((item) => item.designIndex === designIndex);
    if (!result || result.status !== "complete") return;

    try {
      await savePosterTemplate({
        orgId,
        userId,
        name: result.designName,
        nameAr: result.designNameAr,
        description: result.designName,
        category: category!,
        style: "modern",
        designJson: JSON.stringify({
          name: result.designName,
          nameAr: result.designNameAr,
          html: result.html,
        }),
      });
    } catch (err) {
      console.error("Failed to save template:", err);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Hero Section - Show only on main selection step */}
        {step === "select-category" ? (
          <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12 mb-20 mt-8">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-right space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border border-primary/20 rounded-full px-4 py-1.5 shadow-sm animate-fade-in-up">
                <Sparkles size={16} className="text-primary animate-pulse" />
                <span className="text-sm font-semibold text-primary">الجيل الجديد من التصميم</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight">
                <span className="block text-slate-800">صمم إعلاناتك</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-gradient bg-[length:200%_auto]">
                  بالذكاء الاصطناعي
                </span>
              </h1>
              
              <p className="text-xl text-muted leading-relaxed max-w-2xl mx-auto lg:mx-0">
                حوّل أفكارك إلى بوسترات احترافية للسوشيال ميديا في ثوانٍ.
                اختر مجالك، أدخل التفاصيل، واترك الباقي لـ <span className="font-bold text-primary">Postaty AI</span>.
              </p>

              {/* CTA Button */}
              <div className="pt-6 flex justify-center lg:justify-start">
                <button 
                  onClick={scrollToCategories}
                  className="group relative px-8 py-4 bg-primary text-white text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 overflow-hidden hover:scale-105 transition-transform duration-300"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center gap-3">
                    ابدأ التصميم مجاناً
                    <ArrowDown className="animate-bounce" size={20} />
                  </span>
                </button>
              </div>

              {/* Stats / Trust */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-8 opacity-80">
                <div className="text-center lg:text-right">
                  <p className="text-2xl font-bold text-slate-800">10k+</p>
                  <p className="text-sm text-muted">تصميم تم إنشاؤه</p>
                </div>
                <div className="w-px h-8 bg-slate-300" />
                <div className="text-center lg:text-right">
                  <p className="text-2xl font-bold text-slate-800">&lt; 30s</p>
                  <p className="text-sm text-muted">سرعة التنفيذ</p>
                </div>
              </div>
            </div>

            {/* Visual Hero Element */}
            <HeroVisual />
          </div>
        ) : (
          /* Compact Header for inner pages */
          <div className="text-center mb-8 animate-fade-in">
             <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {step === "fill-form" && "أدخل تفاصيل الإعلان"}
              {step === "generating" && "جاري التصميم..."}
              {step === "results" && "النتائج"}
            </h2>
            <p className="text-muted">
               {step === "fill-form" && "أكمل البيانات التالية لنقوم بإنشاء البوستر"}
               {step === "generating" && "الذكاء الاصطناعي يعمل الآن على تصميمك"}
               {step === "results" && "اختر التصميم المناسب أو قم بتحميله"}
            </p>
          </div>
        )}

        {/* Brand kit active indicator */}
        {defaultBrandKit && step === "fill-form" && (
          <div className="mb-6 flex items-center justify-center gap-2 bg-accent/10 border border-accent/30 rounded-xl px-4 py-2.5 mx-auto max-w-fit">
            <Palette size={16} className="text-accent" />
            <span className="text-sm font-medium text-accent">
              هوية العلامة التجارية مفعّلة: {defaultBrandKit.name}
            </span>
          </div>
        )}

        {/* Back button */}
        {step !== "generating" && step !== "select-category" && (
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 mb-8 mx-auto text-muted hover:text-primary transition-colors font-medium px-4 py-2 hover:bg-primary/5 rounded-lg w-fit"
          >
            <div className="p-1 rounded-full bg-card border border-card-border group-hover:border-primary/30 transition-colors">
              <ArrowRight size={16} />
            </div>
            {step === "fill-form"
                ? "تغيير الفئة"
                : "عودة للنموذج"}
          </button>
        )}

        {/* Category label - Only show if not in select-category and no compact header override needed */}
        {category && step !== "select-category" && (
          <div className="mb-8 flex justify-center">
            <span className="inline-block bg-white shadow-sm border border-primary/20 text-primary px-6 py-2 rounded-full text-base font-semibold">
              {CATEGORY_LABELS[category]}
            </span>
          </div>
        )}

        {/* Step content */}
        <div id="categories-section" className="transition-all duration-300 ease-in-out scroll-mt-24">
          {step === "select-category" && (
            <CategorySelector onSelect={handleCategorySelect} />
          )}

          {step === "fill-form" && (
            <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 p-6 md:p-8">
              {category === "restaurant" && (
                <RestaurantForm onSubmit={handleSubmit} isLoading={isPending} />
              )}
              {category === "supermarket" && (
                <SupermarketForm onSubmit={handleSubmit} isLoading={isPending} />
              )}
              {category === "online" && (
                <OnlineForm onSubmit={handleSubmit} isLoading={isPending} />
              )}
            </div>
          )}

          {(step === "generating" || step === "results") && (
            <PosterGrid
              results={results}
              genStep={genStep}
              error={error}
              totalExpected={expectedTotal}
              onSaveAsTemplate={handleSaveAsTemplate}
            />
          )}
        </div>

        {/* Generate more button */}
        {step === "results" && genStep === "complete" && (
          <div className="text-center mt-12">
            <button
              onClick={handleGenerateMore}
              disabled={!lastSubmission || isPending}
              className="px-8 py-3.5 bg-white border border-primary/20 text-primary rounded-xl hover:bg-primary hover:text-white shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all font-bold text-lg transform hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              إنشاء 4 تصاميم إضافية مختلفة
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
