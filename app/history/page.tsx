"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/use-auth";
import { PosterGallery } from "./poster-gallery";
import { GenerationCard } from "./generation-card";
import { Clock, Grid3x3, List, Sparkles, Gift } from "lucide-react";
import type { Category } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/constants";
import Link from "next/link";
import { useLocale } from "@/hooks/use-locale";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

const CATEGORY_LABELS_EN: Record<Category, string> = {
  restaurant: "Restaurants & Cafes",
  supermarket: "Supermarkets",
  ecommerce: "E-commerce",
  services: "Services",
  fashion: "Fashion",
  beauty: "Beauty & Care",
};

export type ImageTypeFilter = "all" | "pro" | "gift";

export default function HistoryPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { locale, t } = useLocale();
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");
  const [selectedCategory, setSelectedCategory] = useState<"all" | Category>("all");
  const [imageType, setImageType] = useState<ImageTypeFilter>("all");

  // Billing for plan gating
  const { data: creditState, mutate: mutateCreditState } = useSWR(
    isSignedIn ? "/api/billing" : null,
    fetcher
  );

  const categoryFilter = selectedCategory === "all" ? undefined : selectedCategory;

  // Handler for gallery view (receives PosterImageData)
  const HISTORY_FILTERS: Array<{ value: "all" | Category; label: string }> = [
    { value: "all", label: t("الكل", "All") },
    { value: "restaurant", label: locale === "ar" ? CATEGORY_LABELS.restaurant : CATEGORY_LABELS_EN.restaurant },
    { value: "supermarket", label: locale === "ar" ? CATEGORY_LABELS.supermarket : CATEGORY_LABELS_EN.supermarket },
    { value: "ecommerce", label: locale === "ar" ? CATEGORY_LABELS.ecommerce : CATEGORY_LABELS_EN.ecommerce },
    { value: "services", label: locale === "ar" ? CATEGORY_LABELS.services : CATEGORY_LABELS_EN.services },
    { value: "fashion", label: locale === "ar" ? CATEGORY_LABELS.fashion : CATEGORY_LABELS_EN.fashion },
    { value: "beauty", label: locale === "ar" ? CATEGORY_LABELS.beauty : CATEGORY_LABELS_EN.beauty },
  ];

  const listParams = new URLSearchParams({ limit: '50' });
  if (categoryFilter) listParams.set('category', categoryFilter);
  const { data: listData, isLoading: isListLoading } = useSWR(
    isSignedIn && viewMode === "list"
      ? `/api/generations?${listParams.toString()}`
      : null,
    fetcher
  );
  const generations = listData?.generations as any[] | undefined;

  return (
    <main className="min-h-screen py-12 px-4 relative overflow-hidden bg-grid-pattern">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4 bg-surface-1/80 backdrop-blur-sm px-6 py-2 rounded-full border border-card-border shadow-sm animate-fade-in-up">
            <Clock size={24} className="text-primary" />
            <span className="text-foreground font-semibold tracking-wide text-sm">
              {t("سجل الإنشاءات", "Generation history")}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-foreground animate-gradient-flow">
            {t("معرض البوسترات", "Poster gallery")}
          </h1>
          <p className="text-muted text-lg max-w-xl mx-auto leading-relaxed font-light">
            {t("عرض جميع البوسترات التي تم إنشاؤها سابقاً", "View all posters generated previously")}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-surface-1/80 backdrop-blur-sm rounded-xl border border-card-border shadow-sm p-1">
            <button
              onClick={() => setViewMode("gallery")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === "gallery"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Grid3x3 size={16} />
              {t("معرض", "Gallery")}
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === "list"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <List size={16} />
              {t("قائمة", "List")}
            </button>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="inline-flex flex-wrap justify-center gap-2 bg-surface-1/80 backdrop-blur-sm rounded-xl border border-card-border shadow-sm p-2">
            {HISTORY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedCategory(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  selectedCategory === filter.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-surface-1/80 backdrop-blur-sm rounded-xl border border-card-border shadow-sm p-1">
            <button
              onClick={() => setImageType("all")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                imageType === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("الكل", "All")}
            </button>
            <button
              onClick={() => setImageType("pro")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                imageType === "pro"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Sparkles size={14} />
              {t("التصميم", "Pro")}
            </button>
            <button
              onClick={() => setImageType("gift")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                imageType === "gift"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Gift size={14} />
              {t("الهدية", "Gift")}
            </button>
          </div>
        </div>

        {!isSignedIn && isLoaded ? (
          <div className="text-center py-16">
            <p className="text-muted mb-6">{t("سجّل الدخول لعرض السجل", "Sign in to view your history")}</p>
            <Link href="/sign-in?redirect_url=/history" className="px-6 py-3 bg-primary text-white rounded-xl font-bold inline-block">
              {t("تسجيل الدخول", "Sign in")}
            </Link>
          </div>
        ) : viewMode === "gallery" ? (
          <PosterGallery category={categoryFilter} imageType={imageType} />
        ) : (
          <div className="max-w-5xl mx-auto space-y-4">
            {!isLoaded || isListLoading || generations === undefined ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : generations.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted">{t("لا توجد إنشاءات بعد", "No generations yet")}</p>
              </div>
            ) : (
              generations
                .filter((gen: any) => {
                  if (imageType === "all") return true;
                  return gen.outputs.some((o: { format: string }) =>
                    imageType === "gift" ? o.format === "gift" : o.format !== "gift"
                  );
                })
                .map((gen: any) => (
                  <GenerationCard key={gen.id} generation={gen} imageType={imageType} />
                ))
            )}
          </div>
        )}
      </div>

    </main>
  );
}
