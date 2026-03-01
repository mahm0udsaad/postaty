"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import { Download, Calendar, Tag, Loader2, Image as ImageIcon, Gift, Megaphone, X, Maximize2 } from "lucide-react";
import { CATEGORY_LABELS, FORMAT_CONFIGS } from "@/lib/constants";
import type { Category, OutputFormat } from "@/lib/types";
import { useLocale } from "@/hooks/use-locale";
import { MarketingContentModal } from "./marketing-content-modal";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import Image from "next/image";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

export interface PosterImageData {
  generationId: string;
  url: string;
  format: string;
  width: number;
  height: number;
  businessName: string;
  productName: string;
  category: string;
  createdAt: number;
  inputs?: string;
}

interface PosterGalleryProps {
  category?: Category;
  imageType?: "all" | "pro" | "gift";
  onCountChange?: (count: number) => void;
}

const CATEGORY_LABELS_EN: Record<Category, string> = {
  restaurant: "Restaurants & Cafes",
  supermarket: "Supermarkets",
  ecommerce: "E-commerce",
  services: "Services",
  fashion: "Fashion",
  beauty: "Beauty & Care",
};

function SkeletonGalleryCard({ index }: { index: number }) {
  return (
    <div
      className="animate-pulse"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="bg-surface-1 rounded-2xl overflow-hidden border border-card-border h-full flex flex-col">
        <div className="w-full bg-surface-2 aspect-[4/5]" />
        <div className="p-3 space-y-2 flex-1">
          <div className="flex justify-between gap-2">
            <div className="h-3 bg-surface-2 rounded w-1/2" />
            <div className="h-3 bg-surface-2 rounded w-1/4" />
          </div>
          <div className="flex justify-between gap-2">
            <div className="h-3 bg-surface-2 rounded w-1/3" />
            <div className="h-3 bg-surface-2 rounded w-1/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PosterGallery({ category, imageType = "all", onCountChange }: PosterGalleryProps) {
  const { locale, t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => { setMounted(true); }, []);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 8; // Load 8 items initially (approx 2 rows)

  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
  });
  if (category) params.set('category', category);

  const { data, isLoading } = useSWR(
    `/api/generations?${params.toString()}`,
    fetcher,
    { keepPreviousData: true }
  );

  // Reset when category changes
  useEffect(() => {
    setOffset(0);
    setAllResults([]);
    setHasMore(true);
  }, [category]);

  // Accumulate results — deduplicate by id to guard against SWR revalidation re-appending
  useEffect(() => {
    if (data?.generations) {
      const gens = data.generations as any[];
      if (offset === 0) {
        setAllResults(gens);
      } else {
        setAllResults(prev => {
          const existingIds = new Set(prev.map((g: any) => g.id));
          const newOnes = gens.filter((g: any) => !existingIds.has(g.id));
          return [...prev, ...newOnes];
        });
      }
      setHasMore(gens.length >= pageSize);
    }
  }, [data, offset]);

  const [selectedImage, setSelectedImage] = useState<PosterImageData | null>(null);
  const [marketingImage, setMarketingImage] = useState<PosterImageData | null>(null);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setOffset(prev => prev + pageSize);
    }
  }, [hasMore, isLoading]);

  const allImages: PosterImageData[] = [];
  if (allResults) {
    for (const generation of allResults) {
      if (generation.status === "complete" || generation.status === "partial") {
        for (const output of generation.outputs ?? []) {
          if (!output.url) continue;
          const isGift = output.format === "gift";
          if (imageType === "pro" && isGift) continue;
          if (imageType === "gift" && !isGift) continue;
          allImages.push({
            generationId: generation.id,
            url: output.url,
            format: output.format,
            width: output.width,
            height: output.height,
            businessName: generation.business_name,
            productName: generation.product_name,
            category: generation.category,
            createdAt: typeof generation.created_at === "number"
              ? generation.created_at
              : new Date(generation.created_at).getTime(),
            inputs: generation.inputs,
          });
        }
      }
    }
  }

  // Sort newest first (safety net for mixed pagination)
  allImages.sort((a, b) => b.createdAt - a.createdAt);

  // Report count to parent
  useEffect(() => {
    onCountChange?.(allImages.length);
  }, [allImages.length, onCountChange]);

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    if (selectedImage) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(timestamp));
  };

  const isFirstLoad = isLoading && offset === 0;

  return (
    <div>
      {isFirstLoad ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonGalleryCard key={i} index={i} />
          ))}
        </div>
      ) : allImages.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-2 flex items-center justify-center border border-card-border">
            <ImageIcon size={36} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {t("لا توجد صور بعد", "No images yet")}
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allImages.map((image, index) => {
              const formatConfig = FORMAT_CONFIGS[image.format as OutputFormat];
              const categoryLabel = locale === "ar"
                ? CATEGORY_LABELS[image.category as Category] ?? image.category
                : CATEGORY_LABELS_EN[image.category as Category] ?? image.category;

              return (
                <div
                  key={`${image.generationId}-${image.format}-${index}`}
                  className="group h-full"
                >
                  <div className="bg-surface-1 rounded-2xl overflow-hidden border border-card-border shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-full flex flex-col">
                    {/* Image with hover overlay */}
                    <div
                      className="relative overflow-hidden bg-surface-2/30 cursor-pointer aspect-[4/5] shrink-0"
                      onClick={() => setSelectedImage(image)}
                    >
                      <Image
                        src={image.url}
                        alt={`${image.businessName} - ${formatConfig?.label ?? image.format}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover block"
                      />
                      {/* Hover overlay — pointer-events-none when hidden so image click fires */}
                      <div
                        className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-300 flex items-center justify-center gap-2 p-3"
                      >
                        {image.inputs && image.format !== "gift" && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setMarketingImage(image); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors shadow-lg"
                          >
                            <Megaphone size={13} />
                            {t("تسويق", "Marketing")}
                          </button>
                        )}
                        <DownloadBtn
                          url={image.url}
                          fileName={`${image.businessName}-${image.format}`}
                          locale={locale}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-900 rounded-lg text-xs font-bold hover:bg-white/90 transition-colors shadow-lg disabled:opacity-50"
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      {/* Expand hint icon */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black/50 text-white rounded-full p-1.5">
                          <Maximize2 size={11} />
                        </div>
                      </div>
                    </div>

                    {/* Info bar */}
                    <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground truncate">
                          {image.businessName}
                        </span>
                        <span className="text-xs text-muted shrink-0 flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(image.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-2 text-foreground rounded-md text-xs">
                          <Tag size={10} />
                          {categoryLabel}
                        </span>
                        {image.format === "gift" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-xs font-medium border border-amber-200">
                            <Gift size={10} />
                            {locale === "ar" ? "هدية" : "Gift"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted font-medium">
                            {formatConfig?.label ?? image.format}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="py-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="flex items-center gap-2 px-8 py-3 bg-surface-1 border border-card-border hover:bg-surface-2 hover:border-primary/30 text-foreground font-bold rounded-xl transition-all disabled:opacity-50 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-primary" />
                    {locale === "ar" ? "جاري التحميل..." : "Loading..."}
                  </>
                ) : (
                  locale === "ar" ? "عرض المزيد" : "Load More"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Full-screen image modal — portaled to body to escape any stacking context */}
      {selectedImage && mounted && createPortal(
        <div
          className="fixed inset-0 bg-black/92 backdrop-blur-sm z-[9999] flex flex-col"
          onClick={() => setSelectedImage(null)}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              {selectedImage.inputs && selectedImage.format !== "gift" && (
                <button
                  onClick={() => { setMarketingImage(selectedImage); setSelectedImage(null); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-all"
                >
                  <Megaphone size={15} />
                  {t("محتوى تسويقي", "Marketing Content")}
                </button>
              )}
              <DownloadBtn
                url={selectedImage.url}
                fileName={`${selectedImage.businessName}-${selectedImage.format}`}
                locale={locale}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50"
              />
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="flex items-center gap-1.5 text-white/80 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all text-sm font-bold"
            >
              <X size={16} />
              {t("إغلاق", "Close")}
            </button>
          </div>

          {/* Image — centered, fills available space */}
          <div
            className="flex-1 flex items-center justify-center px-4 pb-2 min-h-0"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={selectedImage.url}
              alt={selectedImage.businessName}
              width={selectedImage.width || 800}
              height={selectedImage.height || 800}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              style={{ maxHeight: "calc(100vh - 130px)", width: "auto", height: "auto" }}
            />
          </div>

          {/* Bottom info */}
          <div
            className="shrink-0 px-4 py-3 flex items-center gap-3"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <p className="text-white font-bold text-sm">{selectedImage.businessName}</p>
              {selectedImage.productName && (
                <p className="text-white/60 text-xs">{selectedImage.productName}</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {marketingImage && marketingImage.inputs && (
        <MarketingContentModal
          inputs={marketingImage.inputs}
          imageUrl={marketingImage.url}
          businessName={marketingImage.businessName}
          onClose={() => setMarketingImage(null)}
        />
      )}
    </div>
  );
}

function DownloadBtn({
  url,
  fileName,
  className,
  onClick,
  locale,
}: {
  url: string;
  fileName: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  locale: "ar" | "en";
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    if (onClick) onClick(e);
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
    >
      {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {isDownloading
        ? (locale === "ar" ? "جاري التحميل..." : "Downloading...")
        : (locale === "ar" ? "تحميل" : "Download")}
    </button>
  );
}
