"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  Tag,
  Image as ImageIcon,
  Gift,
  Megaphone,
  WandSparkles,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { CATEGORY_LABELS, FORMAT_CONFIGS } from "@/lib/constants";
import type { Category, OutputFormat, PosterResult } from "@/lib/types";
import { useLocale } from "@/hooks/use-locale";
import { MarketingContentModal } from "./marketing-content-modal";
import { PosterModal } from "@/app/components/poster-modal";

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
  onDeleted?: () => void;
}

const CATEGORY_LABELS_EN: Record<Category, string> = {
  restaurant: "Restaurants & Cafes",
  supermarket: "Supermarkets",
  ecommerce: "E-commerce",
  services: "Services",
  fashion: "Fashion",
  beauty: "Beauty & Care",
};

export function GenerationCard({ generation, imageType = "all", onDeleted }: GenerationCardProps) {
  const { locale, t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [marketingOutput, setMarketingOutput] = useState<{ url: string } | null>(null);
  const [editData, setEditData] = useState<{ base64: string; format: string } | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/generations/${generation.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.();
      }
    } catch {
      // silent
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEditClick = async (url: string, format: string) => {
    setIsLoadingEdit(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      setEditData({ base64, format });
    } catch (err) {
      console.error("Failed to load image for editing:", err);
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const editPosterResult: PosterResult | null = useMemo(
    () =>
      editData
        ? {
            designIndex: 0,
            format: (editData.format as OutputFormat) || "square",
            html: "",
            imageBase64: editData.base64,
            status: "complete",
            designName: generation.business_name,
            designNameAr: generation.business_name,
          }
        : null,
    [editData, generation.business_name]
  );

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
    new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
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
        className="w-full p-4 flex flex-col gap-2 hover:bg-surface-2/50 transition-colors text-start"
      >
        {/* Row 1: date · status · thumbnails · chevron */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 text-xs text-muted shrink-0">
            <Calendar size={12} />
            <span>{formatDate(generation.created_at)}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border shrink-0 ${statusInfo.classes}`}>
            {statusInfo.label}
          </span>
          <div className="flex gap-1.5 ml-auto shrink-0">
            {outputsWithUrls.slice(0, 3).map((output, i) =>
              output.url ? (
                <Image
                  key={i}
                  src={output.url}
                  alt=""
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-lg object-cover border border-card-border bg-surface-1"
                />
              ) : (
                <div
                  key={i}
                  className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center border border-card-border"
                >
                  <ImageIcon size={11} className="text-muted-foreground" />
                </div>
              )
            )}
          </div>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <div className="shrink-0 text-muted-foreground">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Row 2: category badge · business name */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-1 text-foreground rounded-lg text-xs font-medium shrink-0 border border-card-border shadow-sm">
            <Tag size={11} className="text-primary" />
            {categoryLabel}
          </span>
          <span className="text-sm font-bold text-foreground truncate">
            {generation.business_name}
          </span>
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
                        <Image
                          src={output.url}
                          alt={label}
                          width={output.width || 800}
                          height={output.height || 800}
                          className="max-w-full max-h-[200px] object-contain rounded-lg shadow-sm"
                          style={{ width: "auto", height: "auto" }}
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
                        {!isGiftOutput && (
                          <button
                            onClick={() => handleEditClick(output.url!, output.format)}
                            disabled={isLoadingEdit}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/5 hover:bg-primary hover:text-white text-primary rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          >
                            {isLoadingEdit ? <Loader2 size={14} className="animate-spin" /> : <WandSparkles size={14} />}
                            {t("تعديل", "Edit")}
                          </button>
                        )}
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

      {/* AI Edit Modal — only mount when open to avoid keeping 50 instances in memory */}
      {editPosterResult && (
        <PosterModal
          isOpen={true}
          onClose={() => setEditData(null)}
          result={editPosterResult}
          generationId={generation.id}
          generationType="poster"
          onEditComplete={(newBase64) =>
            setEditData((prev) => prev ? { ...prev, base64: newBase64 } : null)
          }
        />
      )}

      {marketingOutput && generation.inputs && (
        <MarketingContentModal
          inputs={generation.inputs}
          imageUrl={marketingOutput.url}
          businessName={generation.business_name}
          onClose={() => setMarketingOutput(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface-1 rounded-2xl border border-card-border shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{t("حذف الإنشاء", "Delete generation")}</p>
                <p className="text-xs text-muted mt-0.5">{t("لا يمكن التراجع عن هذا الإجراء", "This action cannot be undone")}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-card-border text-foreground text-sm font-bold hover:bg-surface-2 transition-colors disabled:opacity-50"
              >
                {t("إلغاء", "Cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {t("حذف", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
