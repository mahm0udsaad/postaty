"use client";

import { TEMPLATE_CATEGORY_LABELS, FORMAT_CONFIGS } from "@/lib/constants";
import type { TemplateCategory, OutputFormat } from "@/lib/types";
import { Layers, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TemplateLayer {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  props: Record<string, unknown>;
}

interface TemplateCardProps {
  template: {
    _id: string;
    name: string;
    nameAr: string;
    category: string;
    supportedFormats: string[];
    layers: TemplateLayer[];
    previewUrl?: string | null;
  };
}

const LAYER_COLORS: Record<string, string> = {
  background: "bg-slate-200",
  image: "bg-blue-200",
  logo: "bg-purple-200",
  text: "bg-amber-200",
  shape: "bg-green-200",
  badge: "bg-red-200",
};

export function TemplateCard({ template }: TemplateCardProps) {
  const categoryLabels =
    TEMPLATE_CATEGORY_LABELS[template.category as TemplateCategory];

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 shadow-soft overflow-hidden hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1">
      {/* Preview Area */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {template.previewUrl ? (
          <img
            src={template.previewUrl}
            alt={template.nameAr}
            className="w-full h-full object-cover"
          />
        ) : (
          // Layer-based placeholder preview
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
            {/* Background color from first layer */}
            {template.layers[0]?.type === "background" && (
              <div
                className="absolute inset-0 -z-10 rounded-none"
                style={{
                  backgroundColor:
                    (template.layers[0].props as { fill?: string }).fill ??
                    "#f1f5f9",
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            {template.nameAr}
          </h3>
          {categoryLabels && (
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-xs font-medium">
              {categoryLabels.ar}
            </span>
          )}
        </div>

        {/* Supported Formats */}
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

        {/* Layer count + Use button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Layers size={14} />
            <span>
              {template.layers.length} طبقة
            </span>
          </div>
          <Link
            href={`/?template=${template._id}`}
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
