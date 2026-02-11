"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Category, TemplateCategory, OutputFormat } from "@/lib/types";
import {
  CATEGORY_LABELS,
  TEMPLATE_CATEGORY_LABELS,
  FORMAT_CONFIGS,
} from "@/lib/constants";
import { CategorySelector } from "@/app/components/category-selector";
import {
  ArrowRight,
  LayoutTemplate,
  Loader2,
  Inbox,
  Layers,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const TEMPLATE_CATEGORIES = Object.entries(TEMPLATE_CATEGORY_LABELS) as [
  TemplateCategory,
  { en: string; ar: string },
][];

export default function TemplatePickPage() {
  const [category, setCategory] = useState<Category | null>(null);
  const [templateFilter, setTemplateFilter] = useState<TemplateCategory | null>(null);

  const templates = useQuery(api.templates.listSystem, {
    category: templateFilter ?? undefined,
  });

  const isLoading = templates === undefined;

  // Step 1: Category selection
  if (!category) {
    return (
      <main className="min-h-screen py-12 px-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-3 mb-4 bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20 shadow-sm">
              <LayoutTemplate size={24} className="text-primary" />
              <span className="text-primary font-semibold tracking-wide text-sm">قوالب جاهزة</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
              اختر فئة نشاطك
            </h1>
            <p className="text-muted text-lg max-w-xl mx-auto leading-relaxed">
              اختر نوع نشاطك التجاري لعرض القوالب المناسبة
            </p>
          </div>

          <Link
            href="/"
            className="group flex items-center gap-2 mb-8 text-muted hover:text-primary transition-colors font-medium px-4 py-2 hover:bg-primary/5 rounded-lg w-fit"
          >
            <div className="p-1 rounded-full bg-card border border-card-border group-hover:border-primary/30 transition-colors">
              <ArrowRight size={16} />
            </div>
            الرئيسية
          </Link>

          <CategorySelector onSelect={setCategory} />
        </div>
      </main>
    );
  }

  // Step 2: Template grid
  return (
    <main className="min-h-screen py-12 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4 bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20 shadow-sm">
            <LayoutTemplate size={24} className="text-primary" />
            <span className="text-primary font-semibold tracking-wide text-sm">قوالب جاهزة</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
            اختر قالبك
          </h1>
          <p className="text-muted text-lg max-w-xl mx-auto leading-relaxed">
            اختر قالب وابدأ بتعديله مباشرة — {CATEGORY_LABELS[category]}
          </p>
        </div>

        {/* Back button */}
        <button
          onClick={() => setCategory(null)}
          className="group flex items-center gap-2 mb-8 text-muted hover:text-primary transition-colors font-medium px-4 py-2 hover:bg-primary/5 rounded-lg w-fit"
        >
          <div className="p-1 rounded-full bg-card border border-card-border group-hover:border-primary/30 transition-colors">
            <ArrowRight size={16} />
          </div>
          تغيير الفئة
        </button>

        {/* Category label */}
        <div className="mb-8 flex justify-center">
          <span className="inline-block bg-white shadow-sm border border-primary/20 text-primary px-6 py-2 rounded-full text-base font-semibold">
            {CATEGORY_LABELS[category]}
          </span>
        </div>

        {/* Template category filter tabs */}
        <div className="flex gap-2 mb-8 flex-wrap justify-center">
          <button
            onClick={() => setTemplateFilter(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !templateFilter
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white border border-card-border text-muted hover:border-primary/30 hover:text-primary"
            }`}
          >
            الكل
          </button>
          {TEMPLATE_CATEGORIES.map(([key, labels]) => (
            <button
              key={key}
              onClick={() => setTemplateFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                templateFilter === key
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-white border border-card-border text-muted hover:border-primary/30 hover:text-primary"
              }`}
            >
              {labels.ar}
            </button>
          ))}
        </div>

        {/* Template grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <Inbox size={36} className="text-muted" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              لا توجد قوالب في هذه الفئة
            </h3>
            <p className="text-muted">جرّب فئة أخرى أو اعرض الكل</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template: any) => (
              <PickerTemplateCard
                key={template._id}
                template={template}
                category={category}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ── Template card for the picker ───────────────────────────────────

const LAYER_COLORS: Record<string, string> = {
  background: "bg-slate-200",
  image: "bg-blue-200",
  logo: "bg-purple-200",
  text: "bg-amber-200",
  shape: "bg-green-200",
  badge: "bg-red-200",
};

function PickerTemplateCard({
  template,
  category,
}: {
  template: {
    _id: string;
    name: string;
    nameAr: string;
    category: string;
    supportedFormats: string[];
    layers: { id: string; type: string; x: number; y: number; width: number; height: number; visible: boolean; props: Record<string, unknown> }[];
    previewUrl?: string | null;
  };
  category: Category;
}) {
  const categoryLabels =
    TEMPLATE_CATEGORY_LABELS[template.category as TemplateCategory];

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 shadow-soft overflow-hidden hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1">
      {/* Preview area */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {template.previewUrl ? (
          <img
            src={template.previewUrl}
            alt={template.nameAr}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full p-4">
            {template.layers
              .filter((l) => l.visible && l.type !== "background")
              .map((layer) => (
                <div
                  key={layer.id}
                  className={`absolute rounded-lg ${LAYER_COLORS[layer.type] ?? "bg-gray-200"} opacity-60`}
                  style={{
                    left: `${layer.x * 100}%`,
                    top: `${layer.y * 100}%`,
                    width: `${layer.width * 100}%`,
                    height: `${layer.height * 100}%`,
                  }}
                />
              ))}
            {template.layers[0]?.type === "background" && (
              <div
                className="absolute inset-0 -z-10"
                style={{
                  backgroundColor:
                    (template.layers[0].props as { fill?: string }).fill ?? "#f1f5f9",
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">{template.nameAr}</h3>
          {categoryLabels && (
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-xs font-medium">
              {categoryLabels.ar}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {template.supportedFormats.map((format) => {
            const config = FORMAT_CONFIGS[format as OutputFormat];
            return (
              <span
                key={format}
                className="px-2 py-0.5 bg-slate-100 text-muted rounded-md text-[10px] font-medium"
              >
                {config?.aspectRatio ?? format}
              </span>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Layers size={14} />
            <span>{template.layers.length} طبقة</span>
          </div>
          <Link
            href={`/templates/editor/${template._id}?category=${category}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            استخدم القالب
            <ArrowLeft size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
