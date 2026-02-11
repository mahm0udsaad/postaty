"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TEMPLATE_CATEGORY_LABELS } from "@/lib/constants";
import type { TemplateCategory } from "@/lib/types";
import { TemplateCard } from "./template-card";
import { LayoutTemplate, Loader2, Inbox } from "lucide-react";

const CATEGORIES = Object.entries(TEMPLATE_CATEGORY_LABELS) as [
  TemplateCategory,
  { en: string; ar: string },
][];

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<TemplateCategory | null>(null);

  const templates = useQuery(api.templates.listSystem, {
    category: selectedCategory ?? undefined,
  });

  const isLoading = templates === undefined;

  return (
    <main className="min-h-screen py-12 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4 bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20 shadow-sm">
            <LayoutTemplate size={24} className="text-primary" />
            <span className="text-primary font-semibold tracking-wide text-sm">
              قوالب جاهزة
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
            القوالب
          </h1>
          <p className="text-muted text-lg max-w-xl mx-auto leading-relaxed">
            اختر قالب جاهز وابدأ بتصميم بوسترك بسرعة
          </p>
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 mb-8 flex-wrap justify-center">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !selectedCategory
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white border border-card-border text-muted hover:border-primary/30 hover:text-primary"
            }`}
          >
            الكل
          </button>
          {CATEGORIES.map(([key, labels]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === key
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
              <TemplateCard key={template._id} template={template} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
