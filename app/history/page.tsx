"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/use-auth";
import { PosterGallery } from "./poster-gallery";
import { GenerationCard } from "./generation-card";
import { Clock, Grid3x3, List, Sparkles, Gift, Image as ImageIcon } from "lucide-react";
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

function SkeletonListCard({ index }: { index: number }) {
  return (
    <div
      className="animate-pulse bg-surface-1/70 backdrop-blur-md rounded-2xl border border-card-border shadow-sm p-4"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-3 bg-surface-2 rounded w-24 shrink-0" />
          <div className="h-5 bg-surface-2 rounded-lg w-16 shrink-0 ml-auto" />
          <div className="flex gap-1.5">
            <div className="w-8 h-8 bg-surface-2 rounded-lg" />
            <div className="w-8 h-8 bg-surface-2 rounded-lg" />
            <div className="w-8 h-8 bg-surface-2 rounded-lg" />
          </div>
          <div className="w-4 h-4 bg-surface-2 rounded shrink-0" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 bg-surface-2 rounded-lg w-28 shrink-0" />
          <div className="h-4 bg-surface-2 rounded flex-1 max-w-xs" />
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { locale, t } = useLocale();
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");
  const [selectedCategory, setSelectedCategory] = useState<"all" | Category>("all");
  const [imageType, setImageType] = useState<ImageTypeFilter>("all");
  const [galleryCount, setGalleryCount] = useState<number | null>(null);

  const categoryFilter = selectedCategory === "all" ? undefined : selectedCategory;

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

  const filteredGenerations = generations?.filter((gen: any) => {
    if (imageType === "all") return true;
    return gen.outputs.some((o: { format: string }) =>
      imageType === "gift" ? o.format === "gift" : o.format !== "gift"
    );
  });

  const segmentBtn = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
      active ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
    }`;

  return (
    <main className="min-h-screen py-12 px-4 relative overflow-hidden bg-grid-pattern">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
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

        {/* Unified Toolbar */}
        <div className="mb-8 bg-surface-1/80 backdrop-blur-sm rounded-2xl border border-card-border shadow-sm p-3 flex flex-col gap-3">
          {/* Row 1: View toggle + count + image type */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* View toggle */}
            <div className="inline-flex bg-surface-2 rounded-xl p-1">
              <button onClick={() => setViewMode("gallery")} className={segmentBtn(viewMode === "gallery")}>
                <Grid3x3 size={14} />
                {t("معرض", "Gallery")}
              </button>
              <button onClick={() => setViewMode("list")} className={segmentBtn(viewMode === "list")}>
                <List size={14} />
                {t("قائمة", "List")}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Results count */}
              {viewMode === "gallery" && galleryCount !== null && (
                <span className="text-xs text-muted font-medium px-2 py-1 bg-surface-2 rounded-lg border border-card-border">
                  {galleryCount} {t("صورة", "images")}
                </span>
              )}
              {viewMode === "list" && filteredGenerations !== undefined && (
                <span className="text-xs text-muted font-medium px-2 py-1 bg-surface-2 rounded-lg border border-card-border">
                  {filteredGenerations.length} {t("إنشاء", "results")}
                </span>
              )}
              {/* Image type filter */}
              <div className="inline-flex bg-surface-2 rounded-xl p-1">
                <button onClick={() => setImageType("all")} className={segmentBtn(imageType === "all")}>
                  {t("الكل", "All")}
                </button>
                <button onClick={() => setImageType("pro")} className={segmentBtn(imageType === "pro")}>
                  <Sparkles size={12} />
                  {t("تصميم", "Pro")}
                </button>
                <button onClick={() => setImageType("gift")} className={segmentBtn(imageType === "gift")}>
                  <Gift size={12} />
                  {t("هدية", "Gift")}
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Category chips (horizontal scroll) */}
          <div className="flex overflow-x-auto gap-2 pb-0.5 no-scrollbar">
            {HISTORY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedCategory(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  selectedCategory === filter.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-foreground hover:bg-surface-2 border border-transparent hover:border-card-border"
                }`}
              >
                {filter.label}
              </button>
            ))}
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
          <PosterGallery category={categoryFilter} imageType={imageType} onCountChange={setGalleryCount} />
        ) : (
          <div className="max-w-5xl mx-auto space-y-4">
            {!isLoaded || isListLoading || generations === undefined ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonListCard key={i} index={i} />)
            ) : filteredGenerations!.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-2 flex items-center justify-center border border-card-border">
                  <ImageIcon size={28} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {t("لا توجد إنشاءات بعد", "No generations yet")}
                </h3>
                <p className="text-muted text-sm mb-6">
                  {t("ابدأ بإنشاء أول بوستر لك", "Start by creating your first poster")}
                </p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
                >
                  <Sparkles size={15} />
                  {t("إنشاء بوستر", "Create poster")}
                </Link>
              </div>
            ) : (
              filteredGenerations!.map((gen: any) => (
                <GenerationCard key={gen.id} generation={gen} imageType={imageType} />
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
