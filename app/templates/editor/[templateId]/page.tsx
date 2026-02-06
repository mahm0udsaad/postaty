"use client";

import { useState, useRef, use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Category, OutputFormat, TemplateLayer } from "@/lib/types";
import { EMPTY_FORM_VALUES, type TemplateFormValues } from "@/lib/template-bindings";
import { TemplateRenderer } from "@/app/components/template-editor/template-renderer";
import { TemplateFormRestaurant } from "@/app/components/template-editor/template-form-restaurant";
import { TemplateFormSupermarket } from "@/app/components/template-editor/template-form-supermarket";
import { TemplateFormOnline } from "@/app/components/template-editor/template-form-online";
import { FormatSwitcher } from "@/app/components/template-editor/format-switcher";
import { DownloadButton } from "@/app/components/template-editor/download-button";
import { AIBanner } from "@/app/components/template-editor/ai-banner";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function TemplateEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { templateId } = use(params);
  const { category: categoryParam } = use(searchParams);
  const category = (categoryParam ?? "restaurant") as Category;

  const template = useQuery(api.templates.get, {
    templateId: templateId as Id<"templates">,
  });

  const [values, setValues] = useState<TemplateFormValues>({ ...EMPTY_FORM_VALUES });
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const handleChange = (partial: Partial<TemplateFormValues>) => {
    setValues((prev) => ({ ...prev, ...partial }));
  };

  // Loading state
  if (template === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </main>
    );
  }

  // Not found
  if (template === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-bold">القالب غير موجود</p>
          <Link href="/templates/pick" className="text-primary hover:underline">
            العودة للقوالب
          </Link>
        </div>
      </main>
    );
  }

  const supportedFormats = template.supportedFormats as OutputFormat[];
  const activeFormat = selectedFormat ?? supportedFormats[0] ?? "instagram-square";

  return (
    <main className="min-h-screen py-8 px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/templates/pick?category=${category}`}
              className="group flex items-center gap-2 text-muted hover:text-primary transition-colors font-medium px-4 py-2 hover:bg-primary/5 rounded-lg"
            >
              <div className="p-1 rounded-full bg-card border border-card-border group-hover:border-primary/30 transition-colors">
                <ArrowRight size={16} />
              </div>
              العودة للقوالب
            </Link>
            <h1 className="text-xl font-bold text-foreground">{template.nameAr}</h1>
          </div>
        </div>

        {/* Format switcher */}
        <FormatSwitcher
          supportedFormats={supportedFormats}
          selected={activeFormat}
          onSelect={setSelectedFormat}
        />

        {/* Side-by-side: In RTL, flex-row puts first child on right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form panel (right side in RTL) */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 p-6 space-y-6 order-1">
            <h2 className="text-lg font-bold text-foreground">بيانات البوستر</h2>

            {category === "restaurant" && (
              <TemplateFormRestaurant values={values} onChange={handleChange} />
            )}
            {category === "supermarket" && (
              <TemplateFormSupermarket values={values} onChange={handleChange} />
            )}
            {category === "online" && (
              <TemplateFormOnline values={values} onChange={handleChange} />
            )}

            <DownloadButton captureRef={captureRef} format={activeFormat} />
          </div>

          {/* Preview panel (left side in RTL) */}
          <div className="order-2 lg:order-1 space-y-4">
            <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 p-6">
              <h2 className="text-lg font-bold text-foreground mb-4 text-center">معاينة مباشرة</h2>
              <TemplateRenderer
                ref={captureRef}
                layers={template.layers as TemplateLayer[]}
                values={values}
                format={activeFormat}
              />
            </div>
          </div>
        </div>

        {/* AI marketing banner */}
        <AIBanner />
      </div>
    </main>
  );
}
