"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  Tag,
  Image as ImageIcon,
  Gift,
  Megaphone,
} from "lucide-react";
import { CATEGORY_LABELS, FORMAT_CONFIGS } from "@/lib/constants";
import type { Category, OutputFormat } from "@/lib/types";
import { useLocale } from "@/hooks/use-locale";
import { MarketingContentModal } from "./marketing-content-modal";

interface GenerationOutput {
  format: string;
  storageId?: string;
  url?: string | null;
  width: number;
  height: number;
}

interface GenerationData {
  id: string;
  category: string;
  business_name: string;
  product_name: string;
  status: string;
  outputs: GenerationOutput[];
  created_at: number;
  error?: string;
  inputs?: string;
}

interface GenerationCardProps {
  generation: GenerationData;
  imageType?: "all" | "pro" | "gift";
}

const CATEGORY_LABELS_EN: Record<Category, string> = {
  restaurant: "Restaurants & Cafes",
  supermarket: "Supermarkets",
  ecommerce: "E-commerce",
  services: "Services",
  fashion: "Fashion",
  beauty: "Beauty & Care",
};

export function GenerationCard({ generation, imageType = "all" }: GenerationCardProps) {
  const { locale, t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [marketingOutput, setMarketingOutput] = useState<{ url: string } | null>(null);

  const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
    complete: {
      label: t("مكتمل", "Complete"),
      classes: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    partial: {
      label: t("جزئي", "Partial"),
      classes: "bg-amber-50 text-amber-600 border-amber-200",
    },
    failed: {
      label: t("فشل", "Failed"),
      classes: "bg-red-50 text-red-600 border-red-200",
    },
    processing: {
      label: t("جاري المعالجة", "Processing"),
      classes: "bg-blue-50 text-blue-600 border-blue-200 animate-pulse",
    },
    queued: {
      label: t("في الانتظار", "Queued"),
      classes: "bg-surface-1 text-muted border-card-border",
    },
  };

  const statusInfo = STATUS_LABELS[generation.status] ?? STATUS_LABELS.queued;
  const categoryLabel = locale === "ar"
    ? CATEGORY_LABELS[generation.category as Category] ?? generation.category
    : CATEGORY_LABELS_EN[generation.category as Category] ?? generation.category;

  const filteredOutputs = (generation.outputs ?? []).filter((o) => {
    const isGift = o.format === "gift";
    if (imageType === "pro" && isGift) return false;
    if (imageType === "gift" && !isGift) return false;
    return true;
  });

  const outputsWithUrls = filteredOutputs.filter(
    (o) => o.url || o.storageId
  );

  const formatDate = (timestamp: number): string =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));

  const handleDownload = async (url: string, format: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `poster-${format}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      // silent
    }
  };

  return (
    <div className="bg-surface-1/70 backdrop-blur-md rounded-2xl border border-card-border shadow-sm overflow-hidden transition-all hover:bg-surface-1/90 hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 hover:bg-surface-2/50 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-xs text-muted shrink-0">
          <Calendar size={14} />
          <span>{formatDate(generation.created_at)}</span>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-1 text-foreground rounded-lg text-xs font-medium shrink-0 border border-card-border shadow-sm">
          <Tag size={12} className="text-primary" />
          {categoryLabel}
        </span>

        <span className="text-sm font-bold text-foreground truncate">
          {generation.business_name}
        </span>

        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border shrink-0 ${statusInfo.classes}`}>
          {statusInfo.label}
        </span>

        <div className="flex gap-1.5 mr-auto">
          {outputsWithUrls.slice(0, 3).map((output, i) =>
            output.url ? (
              <img
                key={i}
                src={output.url}
                alt=""
                className="w-8 h-8 rounded-lg object-cover border border-card-border bg-surface-1"
              />
            ) : (
              <div
                key={i}
                className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center border border-card-border"
              >
                <ImageIcon size={12} className="text-muted-foreground" />
              </div>
            )
          )}
        </div>

        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-card-border p-4 bg-surface-2/50">
          {generation.error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              {generation.error}
            </div>
          )}

          {filteredOutputs.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">
              {t("لا توجد صور متاحة", "No images available")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOutputs.map((output, i) => {
                const isGiftOutput = output.format === "gift";
                const formatConfig = FORMAT_CONFIGS[output.format as OutputFormat];
                const label = isGiftOutput
                  ? (locale === "ar" ? "هدية" : "Gift")
                  : (formatConfig?.label ?? output.format);

                return (
                  <div
                    key={i}
                    className="bg-surface-1 rounded-xl border border-card-border overflow-hidden shadow-sm"
                  >
                    <div className="p-3 border-b border-card-border bg-surface-2/50">
                      <p className="text-xs font-bold text-center text-foreground flex items-center justify-center gap-1.5">
                        {isGiftOutput && <Gift size={12} className="text-amber-500" />}
                        {label}
                      </p>
                    </div>
                    <div className="p-4 flex justify-center items-center min-h-[160px] bg-surface-2/30">
                      {output.url ? (
                        <img
                          src={output.url}
                          alt={label}
                          className="max-w-full max-h-[200px] object-contain rounded-lg shadow-sm"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageIcon size={24} />
                          <span className="text-xs">{t("غير متاح", "Unavailable")}</span>
                        </div>
                      )}
                    </div>
                    {output.url && (
                      <div className="p-3 border-t border-card-border bg-surface-1 flex gap-2">
                        {generation.inputs && !isGiftOutput && (
                          <button
                            onClick={() => setMarketingOutput({ url: output.url! })}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-accent/5 hover:bg-accent hover:text-white text-accent rounded-lg text-xs font-bold transition-all"
                          >
                            <Megaphone size={14} />
                            {t("تسويق", "Marketing")}
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(output.url!, output.format)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-surface-1 border border-card-border text-foreground rounded-lg text-xs font-bold hover:bg-surface-1 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                        >
                          <Download size={14} />
                          {t("تحميل", "Download")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {marketingOutput && generation.inputs && (
        <MarketingContentModal
          inputs={generation.inputs}
          imageUrl={marketingOutput.url}
          businessName={generation.business_name}
          onClose={() => setMarketingOutput(null)}
        />
      )}
    </div>
  );
}
