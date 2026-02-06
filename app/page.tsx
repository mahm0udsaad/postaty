"use client";

import { useState, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Category, PostFormData, GenerationResult } from "@/lib/types";
import type { BrandKitPromptData } from "@/lib/prompts";
import { CATEGORY_LABELS, FORMAT_CONFIGS } from "@/lib/constants";
import { CategorySelector } from "./components/category-selector";
import { RestaurantForm } from "./components/forms/restaurant-form";
import { SupermarketForm } from "./components/forms/supermarket-form";
import { OnlineForm } from "./components/forms/online-form";
import { GenerationView } from "./components/generation-view";
import { generatePoster } from "./actions";
import { uploadBase64ToConvex } from "@/lib/convex-upload";
import { useDevIdentity } from "@/hooks/use-dev-identity";
import { PathSelector } from "./components/path-selector";
import { ArrowRight, Sparkles, Palette } from "lucide-react";
import { useRouter } from "next/navigation";

type AppStep = "select-path" | "select-category" | "fill-form" | "generating" | "results";

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
  const router = useRouter();
  const [step, setStep] = useState<AppStep>("select-path");
  const [category, setCategory] = useState<Category | null>(null);
  const [genStep, setGenStep] = useState<
    "crafting-prompt" | "generating-images" | "complete" | "error"
  >("crafting-prompt");
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const { orgId, userId } = useDevIdentity();

  // Convex mutations for saving generations
  const createGeneration = useMutation(api.generations.create);
  const updateOutput = useMutation(api.generations.updateOutput);
  const updateStatus = useMutation(api.generations.updateStatus);
  const updatePrompt = useMutation(api.generations.updatePrompt);
  const generateUploadUrl = useMutation(api.generations.generateUploadUrl);

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
    if (step === "select-category") {
      setStep("select-path");
    } else if (step === "fill-form") {
      setCategory(null);
      setStep("select-category");
    } else if (step === "results") {
      setResults([]);
      setError(undefined);
      setStep("fill-form");
    }
  };

  const handleSubmit = (data: PostFormData) => {
    setStep("generating");
    setGenStep("crafting-prompt");
    setResults([]);
    setError(undefined);

    const startTime = Date.now();

    startTransition(async () => {
      try {
        setGenStep("generating-images");

        const result = await generatePoster(data, brandKitPromptData);

        setResults(result.results);
        setGenStep("complete");
        setStep("results");

        // Background: save generation to Convex
        const successfulResults = result.results.filter(
          (r) => r.status === "complete" && r.imageBase64
        );

        if (successfulResults.length > 0) {
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
              creditsCharged: successfulResults.length,
            });

            // Save the prompt
            await updatePrompt({
              generationId,
              promptUsed: result.prompt,
            });

            // Upload each image to Convex storage
            for (const r of successfulResults) {
              try {
                const storageId = await uploadBase64ToConvex(
                  r.imageBase64,
                  generateUploadUrl
                );
                const config = FORMAT_CONFIGS[r.format];
                await updateOutput({
                  generationId,
                  format: r.format,
                  storageId: storageId as any,
                  width: config.width,
                  height: config.height,
                });
              } catch (uploadErr) {
                console.error(`Failed to upload ${r.format}:`, uploadErr);
              }
            }

            // Mark generation complete
            await updateStatus({
              generationId,
              status:
                successfulResults.length === data.formats.length
                  ? "complete"
                  : "partial",
              durationMs: Date.now() - startTime,
            });
          } catch (saveErr) {
            console.error("Failed to save generation to Convex:", saveErr);
          }
        }
      } catch (err) {
        setGenStep("error");
        setError(
          err instanceof Error ? err.message : "حدث خطأ غير متوقع"
        );
        setStep("results");
      }
    });
  };

  return (
    <main className="min-h-screen py-12 px-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4 bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20 shadow-sm">
            <Sparkles size={24} className="text-primary" />
            <span className="text-primary font-semibold tracking-wide text-sm">أدوات الذكاء الاصطناعي</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-gradient bg-[length:200%_auto]">
            مولد بوسترات السوشيال ميديا
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed">
            أنشئ بوسترات احترافية وجذابة لعروضك في ثوانٍ معدودة باستخدام أحدث تقنيات الذكاء الاصطناعي
          </p>
        </div>

        {/* Brand kit active indicator */}
        {defaultBrandKit && step === "fill-form" && (
          <div className="mb-6 flex items-center justify-center gap-2 bg-accent/10 border border-accent/30 rounded-xl px-4 py-2.5">
            <Palette size={16} className="text-accent" />
            <span className="text-sm font-medium text-accent">
              هوية العلامة التجارية مفعّلة: {defaultBrandKit.name}
            </span>
          </div>
        )}

        {/* Back button */}
        {step !== "select-path" && step !== "generating" && (
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 mb-8 text-muted hover:text-primary transition-colors font-medium px-4 py-2 hover:bg-primary/5 rounded-lg w-fit"
          >
            <div className="p-1 rounded-full bg-card border border-card-border group-hover:border-primary/30 transition-colors">
              <ArrowRight size={16} />
            </div>
            {step === "select-category"
              ? "الرئيسية"
              : step === "fill-form"
                ? "اختيار الفئة"
                : "عودة للنموذج"}
          </button>
        )}

        {/* Category label */}
        {category && step !== "select-category" && (
          <div className="mb-8 flex justify-center">
            <span className="inline-block bg-white shadow-sm border border-primary/20 text-primary px-6 py-2 rounded-full text-base font-semibold">
              {CATEGORY_LABELS[category]}
            </span>
          </div>
        )}

        {/* Step content */}
        <div className="transition-all duration-300 ease-in-out">
          {step === "select-path" && (
            <PathSelector
              onSelectAI={() => setStep("select-category")}
              onSelectTemplates={() => router.push("/templates/pick")}
            />
          )}

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
            <GenerationView step={genStep} results={results} error={error} />
          )}
        </div>

        {/* New poster button */}
        {step === "results" && genStep === "complete" && (
          <div className="text-center mt-12">
            <button
              onClick={() => {
                setCategory(null);
                setStep("select-path");
                setResults([]);
              }}
              className="px-8 py-3.5 bg-white border border-primary/20 text-primary rounded-xl hover:bg-primary hover:text-white shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all font-bold text-lg transform hover:-translate-y-1"
            >
              إنشاء بوستر جديد
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
