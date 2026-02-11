"use client";

import { useState, useRef, useEffect } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Download, Calendar, Tag, Loader2, Image as ImageIcon } from "lucide-react";
import { CATEGORY_LABELS, FORMAT_CONFIGS } from "@/lib/constants";
import type { Category, OutputFormat } from "@/lib/types";
import type { Id } from "@/convex/_generated/dataModel";

interface PosterImageData {
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
  orgId: Id<"organizations">;
  category?: Category;
}

export function PosterGallery({ orgId, category }: PosterGalleryProps) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.generations.listByOrgPaginated,
    { orgId, category },
    { initialNumItems: 12 }
  );

  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<PosterImageData | null>(null);

  // Flatten all outputs into a single array of images
  const allImages: PosterImageData[] = [];
  if (results) {
    for (const generation of results) {
      if (generation.status === "complete" || generation.status === "partial") {
        for (const output of generation.outputs) {
          if (output.url) {
            allImages.push({
              generationId: generation._id,
              url: output.url,
              format: output.format,
              width: output.width,
              height: output.height,
              businessName: generation.businessName,
              productName: generation.productName,
              category: generation.category,
              createdAt: generation.createdAt,
            });
          }
        }
      }
    }
  }

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && status === "CanLoadMore") {
          loadMore(6);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [status, loadMore]);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
    }).format(new Date(timestamp));
  };

  const isLoading = status === "LoadingFirstPage";

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : allImages.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
            <ImageIcon size={36} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            لا توجد صور بعد
          </h3>
          <p className="text-slate-500">
            ابدأ بإنشاء أول بوستر من صفحة الإنشاء
          </p>
        </div>
      ) : (
        <>
          {/* Masonry Grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {allImages.map((image, index) => {
              const formatConfig = FORMAT_CONFIGS[image.format as OutputFormat];
              const categoryLabel = CATEGORY_LABELS[image.category as Category] ?? image.category;

              return (
                <div
                  key={`${image.generationId}-${image.format}-${index}`}
                  className="break-inside-avoid group relative"
                >
                  <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    {/* Image */}
                    <button
                      onClick={() => setSelectedImage(image)}
                      className="w-full block overflow-hidden bg-slate-100/30"
                    >
                      <img
                        src={image.url}
                        alt={`${image.businessName} - ${formatConfig?.label ?? image.format}`}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    </button>

                    {/* Overlay Info */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {image.businessName}
                        </span>
                        <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(image.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs">
                          <Tag size={10} />
                          {categoryLabel}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {formatConfig?.label ?? image.format}
                        </span>
                      </div>

                      <DownloadBtn 
                        url={image.url} 
                        fileName={`${image.businessName}-${image.format}`}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-primary/5 hover:bg-primary hover:text-white text-primary rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Trigger */}
          <div ref={observerTarget} className="py-8">
            {status === "LoadingMore" && (
              <div className="flex justify-center">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            )}
          </div>
        </>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <div className="absolute -top-12 left-0 right-0 flex items-center justify-between">
              <DownloadBtn 
                url={selectedImage.url} 
                fileName={`${selectedImage.businessName}-${selectedImage.format}`}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-all backdrop-blur-sm disabled:opacity-50"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="text-white hover:text-slate-300 text-sm font-bold px-4 py-2"
              >
                إغلاق ✕
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
  onClick
}: { 
  url: string; 
  fileName: string; 
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
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
      {isDownloading ? "جاري التحميل..." : "تحميل"}
    </button>
  );
}
