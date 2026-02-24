"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Download, Calendar, Tag, Loader2, Image as ImageIcon, Gift, Film } from "lucide-react";
import { CATEGORY_LABELS, FORMAT_CONFIGS } from "@/lib/constants";
import type { Category, OutputFormat } from "@/lib/types";
import { useLocale } from "@/hooks/use-locale";

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
}

interface PosterGalleryProps {
  category?: Category;
  imageType?: "all" | "pro" | "gift";
  onTurnIntoReel?: (image: PosterImageData) => void;
}

const CATEGORY_LABELS_EN: Record<Category, string> = {
  restaurant: "Restaurants & Cafes",
  supermarket: "Supermarkets",
  ecommerce: "E-commerce",
  services: "Services",
  fashion: "Fashion",
  beauty: "Beauty & Care",
};

export function PosterGallery({ category, imageType = "all", onTurnIntoReel }: PosterGalleryProps) {
  const { locale, t } = useLocale();
  const [offset, setOffset] = useState(0);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 12;

  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
  });
  if (category) params.set('category', category);

  const { data, isLoading } = useSWR(
    `/api/generations?${params.toString()}`,
    fetcher
  );

  // Reset when category changes
  useEffect(() => {
    setOffset(0);
    setAllResults([]);
    setHasMore(true);
  }, [category]);

  // Accumulate results
  useEffect(() => {
    if (data?.generations) {
      const gens = data.generations as any[];
      if (offset === 0) {
        setAllResults(gens);
      } else {
        setAllResults(prev => [...prev, ...gens]);
      }
      setHasMore(gens.length >= pageSize);
    }
  }, [data, offset]);

  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<PosterImageData | null>(null);

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
          });
        }
      }
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(timestamp));
  };

  const isFirstLoad = isLoading && offset === 0;

  return (
    <div>
      {isFirstLoad ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : allImages.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-2 flex items-center justify-center border border-card-border">
            <ImageIcon size={36} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {t("لا توجد صور بعد", "No images yet")}
          </h3>
          <p className="text-muted">
            {t("ابدأ بإنشاء أول بوستر من صفحة الإنشاء", "Create your first poster from the create page")}
          </p>
        </div>
      ) : (
        <>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {allImages.map((image, index) => {
              const formatConfig = FORMAT_CONFIGS[image.format as OutputFormat];
              const categoryLabel = locale === "ar"
                ? CATEGORY_LABELS[image.category as Category] ?? image.category
                : CATEGORY_LABELS_EN[image.category as Category] ?? image.category;

              return (
                <div
                  key={`${image.generationId}-${image.format}-${index}`}
                  className="break-inside-avoid group relative"
                >
                  <div className="bg-surface-1 rounded-2xl overflow-hidden border border-card-border shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <button
                      onClick={() => setSelectedImage(image)}
                      className="w-full block overflow-hidden bg-surface-2/30"
                    >
                      <img
                        src={image.url}
                        alt={`${image.businessName} - ${formatConfig?.label ?? image.format}`}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    </button>

                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground truncate">
                          {image.businessName}
                        </span>
                        <span className="text-xs text-muted shrink-0 flex items-center gap-1">
                          <Calendar size={12} />
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

                      <div className="flex items-center gap-2">
                        {onTurnIntoReel && image.format !== "gift" && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onTurnIntoReel(image); }}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-500/10 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white text-purple-600 rounded-lg text-xs font-bold transition-all"
                          >
                            <Film size={14} />
                            {t("ريلز", "Reel")}
                          </button>
                        )}
                        <DownloadBtn
                          url={image.url}
                          fileName={`${image.businessName}-${image.format}`}
                          locale={locale}
                          className={`${onTurnIntoReel && image.format !== "gift" ? "flex-1" : "w-full"} flex items-center justify-center gap-2 py-2 bg-primary/5 hover:bg-primary hover:text-white text-primary rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={observerTarget} className="py-8">
            {isLoading && offset > 0 && (
              <div className="flex justify-center">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            )}
          </div>
        </>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <div className="absolute -top-12 left-0 right-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {onTurnIntoReel && selectedImage.format !== "gift" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onTurnIntoReel(selectedImage); setSelectedImage(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-bold transition-all backdrop-blur-sm shadow-lg shadow-purple-500/25"
                  >
                    <Film size={16} />
                    {t("تحويل إلى ريلز", "Turn into Reel")}
                  </button>
                )}
                <DownloadBtn
                  url={selectedImage.url}
                  fileName={`${selectedImage.businessName}-${selectedImage.format}`}
                  locale={locale}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-all backdrop-blur-sm disabled:opacity-50"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-white hover:text-muted text-sm font-bold px-4 py-2"
              >
                {t("إغلاق", "Close")} ✕
              </button>
            </div>
            <img
              src={selectedImage.url}
              alt={selectedImage.businessName}
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <p className="text-white font-bold">{selectedImage.businessName}</p>
              <p className="text-white/70 text-sm">{selectedImage.productName}</p>
            </div>
          </div>
        </div>
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
      {isDownloading ? (locale === "ar" ? "جاري التحميل..." : "Downloading...") : (locale === "ar" ? "تحميل" : "Download")}
    </button>
  );
}
