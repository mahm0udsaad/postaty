"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  Calendar,
  Tag,
  Loader2,
  Image as ImageIcon,
  Gift,
  Sparkles,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_LABELS_EN, FORMAT_CONFIGS } from "@/lib/constants";
import type { Category, OutputFormat } from "@/lib/types";
import { useLocale } from "@/hooks/use-locale";
import { motion } from "framer-motion";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/lib/animation";
import { GallerySkeleton } from "./skeletons";

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
}

export function PosterGallery({ category, imageType = "all" }: PosterGalleryProps) {
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

  const { data, error, isLoading, mutate } = useSWR(
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  const selectedImage = selectedIndex !== null ? allImages[selectedIndex] ?? null : null;

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

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          if (prev === null) return null;
          if (e.key === "ArrowLeft") return Math.max(0, prev - 1);
          return Math.min(allImages.length - 1, prev + 1);
        });
      }
      if (e.key === "Escape") {
        setSelectedIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, allImages.length]);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(timestamp));
  };

  const isFirstLoad = isLoading && offset === 0;

  return (
    <div>
      {error && !data ? (
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
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            <RotateCcw size={16} />
            {t("إعادة المحاولة", "Retry")}
          </button>
        </div>
      ) : isFirstLoad ? (
        <GallerySkeleton />
      ) : allImages.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-2 flex items-center justify-center border border-card-border">
            <ImageIcon size={36} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {t("لا توجد صور بعد", "No images yet")}
          </h3>
          <p className="text-muted mb-6">
            {t("ابدأ بإنشاء أول بوستر من صفحة الإنشاء", "Create your first poster from the create page")}
          </p>
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
          <motion.div
            variants={STAGGER_CONTAINER}
            initial="initial"
            animate="animate"
            className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
          >
            {allImages.map((image, index) => {
              const formatConfig = FORMAT_CONFIGS[image.format as OutputFormat];
              const categoryLabel = locale === "ar"
                ? CATEGORY_LABELS[image.category as Category] ?? image.category
                : CATEGORY_LABELS_EN[image.category as Category] ?? image.category;

              return (
                <motion.div
                  key={`${image.generationId}-${image.format}-${index}`}
                  variants={STAGGER_ITEM}
                  className="break-inside-avoid group relative"
                >
                  <div className="bg-surface-1 rounded-2xl overflow-hidden border border-card-border shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <button
                      onClick={() => setSelectedIndex(index)}
                      className="w-full block overflow-hidden bg-surface-2/30"
                    >
                      <Image
                        src={image.url}
                        alt={`${image.businessName} - ${formatConfig?.label ?? image.format}`}
                        width={image.width || 1080}
                        height={image.height || 1080}
                        className="w-full h-auto object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
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
                        <DownloadBtn
                          url={image.url}
                          fileName={`${image.businessName}-${image.format}`}
                          locale={locale}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-primary/5 hover:bg-primary hover:text-white text-primary rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <div ref={observerTarget} className="py-8">
            {isLoading && offset > 0 && (
              <div className="flex justify-center">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            )}
          </div>
        </>
      )}

      {/* Lightbox Modal */}
      {selectedImage && selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <div className="absolute -top-12 left-0 right-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DownloadBtn
                  url={selectedImage.url}
                  fileName={`${selectedImage.businessName}-${selectedImage.format}`}
                  locale={locale}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-all backdrop-blur-sm disabled:opacity-50"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-white/70 text-sm">
                  {selectedIndex + 1} / {allImages.length}
                </span>
              </div>
              <button
                onClick={() => setSelectedIndex(null)}
                className="text-white hover:text-muted text-sm font-bold px-4 py-2"
              >
                {t("إغلاق", "Close")} ✕
              </button>
            </div>

            {/* Previous button */}
            {selectedIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex - 1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label={locale === "ar" ? "السابق" : "Previous"}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Next button */}
            {selectedIndex < allImages.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex + 1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label={locale === "ar" ? "التالي" : "Next"}
              >
                <ChevronRight size={24} />
              </button>
            )}

            <Image
              src={selectedImage.url}
              alt={selectedImage.businessName}
              width={selectedImage.width || 1080}
              height={selectedImage.height || 1080}
              className="w-full h-auto object-contain rounded-lg"
              sizes="100vw"
              priority
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
      const ext = blob.type === "image/jpeg" ? "jpg" : "png";
      link.download = `${fileName}.${ext}`;
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
