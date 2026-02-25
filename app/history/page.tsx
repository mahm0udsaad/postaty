"use client";

import { Suspense } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/use-auth";
import { PosterGallery } from "./poster-gallery";
import { GenerationCard } from "./generation-card";
import { Clock, Grid3x3, List, Sparkles, Gift, AlertCircle, RotateCcw } from "lucide-react";
import type { Category } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_LABELS_EN } from "@/lib/constants";
import Link from "next/link";
import { useLocale } from "@/hooks/use-locale";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FADE_UP } from "@/lib/animation";
import { HistoryPageSkeleton, ListSkeleton } from "./skeletons";
import { ErrorBoundary } from "@/app/components/error-boundary";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

export type ImageTypeFilter = "all" | "pro" | "gift";

const LIST_PAGE_SIZE = 10;

export default function HistoryPage() {
  return (
    <ErrorBoundary
      fallbackTitle="Something went wrong"
      fallbackMessage="An error occurred loading your history. Please try again."
    >
      <Suspense fallback={<HistoryPageSkeleton />}>
        <HistoryPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function HistoryPageContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const { locale, t } = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const viewMode = (searchParams.get("view") as "gallery" | "list") || "gallery";
  const selectedCategory = (searchParams.get("category") as "all" | Category) || "all";
  const imageType = (searchParams.get("type") as ImageTypeFilter) || "all";
  const listPage = parseInt(searchParams.get("page") || "1", 10);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || (key === "view" && value === "gallery")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    if (key === "category" || key === "type" || key === "view") {
      params.delete("page");
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

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

  const listOffset = (listPage - 1) * LIST_PAGE_SIZE;
  const listParams = new URLSearchParams({
    limit: String(LIST_PAGE_SIZE),
    offset: String(listOffset),
  });
  if (categoryFilter) listParams.set('category', categoryFilter);

  const { data: listData, error: listError, isLoading: isListLoading, mutate: mutateList } = useSWR(
    isSignedIn && viewMode === "list"
      ? `/api/generations?${listParams.toString()}`
      : null,
    fetcher
  );
  const generations = listData?.generations as any[] | undefined;
  const totalCount = listData?.total as number | undefined;
  const totalPages = totalCount ? Math.ceil(totalCount / LIST_PAGE_SIZE) : 0;

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
              onClick={() => setParam("view", "gallery")}
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
              onClick={() => setParam("view", "list")}
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
                onClick={() => setParam("category", filter.value)}
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
              onClick={() => setParam("type", "all")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                imageType === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t("الكل", "All")}
            </button>
            <button
              onClick={() => setParam("type", "pro")}
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
              onClick={() => setParam("type", "gift")}
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

        <AnimatePresence mode="wait">
          {!isSignedIn && isLoaded ? (
            <motion.div key="signin" {...FADE_UP} className="text-center py-16">
              <p className="text-muted mb-6">{t("سجّل الدخول لعرض السجل", "Sign in to view your history")}</p>
              <Link href="/sign-in?redirect_url=/history" className="px-6 py-3 bg-primary text-white rounded-xl font-bold inline-block">
                {t("تسجيل الدخول", "Sign in")}
              </Link>
            </motion.div>
          ) : viewMode === "gallery" ? (
            <motion.div key="gallery" {...FADE_UP}>
              <PosterGallery category={categoryFilter} imageType={imageType} />
            </motion.div>
          ) : (
            <motion.div key="list" {...FADE_UP}>
              <div className="max-w-5xl mx-auto space-y-4">
                {!isLoaded || isListLoading || generations === undefined ? (
                  listError ? (
                    <div className="text-center py-20 space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center border border-red-200">
                        <AlertCircle size={28} className="text-red-500" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        {t("حدث خطأ في تحميل البيانات", "Failed to load data")}
                      </h3>
                      <p className="text-muted text-sm">
                        {t("تعذّر تحميل السجل. حاول مرة أخرى.", "Could not load history. Please try again.")}
                      </p>
                      <button
                        onClick={() => mutateList()}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
                      >
                        <RotateCcw size={16} />
                        {t("إعادة المحاولة", "Retry")}
                      </button>
                    </div>
                  ) : (
                    <ListSkeleton />
                  )
                ) : generations.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-muted mb-6">{t("لا توجد إنشاءات بعد", "No generations yet")}</p>
                    <Link
                      href="/create"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
                    >
                      <Sparkles size={16} />
                      {t("إنشاء بوستر جديد", "Create your first poster")}
                    </Link>
                  </div>
                ) : (
                  <>
                    {generations
                      .filter((gen: any) => {
                        if (imageType === "all") return true;
                        return gen.outputs.some((o: { format: string }) =>
                          imageType === "gift" ? o.format === "gift" : o.format !== "gift"
                        );
                      })
                      .map((gen: any) => (
                        <GenerationCard key={gen.id} generation={gen} imageType={imageType} />
                      ))
                    }
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8 pt-4">
                        <button
                          onClick={() => setParam("page", String(listPage - 1))}
                          disabled={listPage <= 1}
                          className="px-4 py-2 rounded-lg border border-card-border text-sm font-bold disabled:opacity-40 hover:bg-surface-2 transition-colors"
                        >
                          {t("السابق", "Previous")}
                        </button>
                        <span className="text-sm text-muted px-4">
                          {locale === "ar"
                            ? `صفحة ${listPage} من ${totalPages}`
                            : `Page ${listPage} of ${totalPages}`}
                        </span>
                        <button
                          onClick={() => setParam("page", String(listPage + 1))}
                          disabled={listPage >= totalPages}
                          className="px-4 py-2 rounded-lg border border-card-border text-sm font-bold disabled:opacity-40 hover:bg-surface-2 transition-colors"
                        >
                          {t("التالي", "Next")}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
