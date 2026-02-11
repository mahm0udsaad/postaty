"use client";

import { useState } from "react";
import { useDevIdentity } from "@/hooks/use-dev-identity";
import { PosterGallery } from "./poster-gallery";
import { GenerationCard } from "./generation-card";
import { Clock, Grid3x3, List } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Category } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/constants";

const HISTORY_FILTERS: Array<{ value: "all" | Category; label: string }> = [
  { value: "all", label: "الكل" },
  { value: "restaurant", label: CATEGORY_LABELS.restaurant },
  { value: "supermarket", label: CATEGORY_LABELS.supermarket },
  { value: "online", label: CATEGORY_LABELS.online },
];

export default function HistoryPage() {
  const { orgId } = useDevIdentity();
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");
  const [selectedCategory, setSelectedCategory] = useState<"all" | Category>("all");
  const categoryFilter = selectedCategory === "all" ? undefined : selectedCategory;

  // Only fetch for list view
  const generations = useQuery(
    api.generations.listByOrg,
    viewMode === "list" ? { orgId, limit: 50, category: categoryFilter } : "skip"
  );

  return (
    <main className="min-h-screen py-12 px-4 relative overflow-hidden bg-grid-pattern">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full border border-slate-200/60 shadow-sm animate-fade-in-up">
            <Clock size={24} className="text-primary" />
            <span className="text-slate-700 font-semibold tracking-wide text-sm">
              سجل الإنشاءات
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900 animate-gradient-flow">
            معرض البوسترات
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed font-light">
            عرض جميع البوسترات التي تم إنشاؤها سابقاً
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm p-1">
            <button
              onClick={() => setViewMode("gallery")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === "gallery"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Grid3x3 size={16} />
              معرض
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === "list"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List size={16} />
              قائمة
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex flex-wrap justify-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm p-2">
            {HISTORY_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedCategory(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  selectedCategory === filter.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {viewMode === "gallery" ? (
          <PosterGallery orgId={orgId} category={categoryFilter} />
        ) : (
          <div className="max-w-5xl mx-auto space-y-4">
            {generations === undefined ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : generations.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-500">لا توجد إنشاءات بعد</p>
              </div>
            ) : (
              generations.map((gen) => (
                <GenerationCard key={gen._id} generation={gen} />
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
