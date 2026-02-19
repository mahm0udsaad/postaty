"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_LABELS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

const ASPECTS = ["aspect-square", "aspect-[4/5]", "aspect-[3/4]", "aspect-[5/6]"] as const;

export function ShowcaseGalleryClient() {
  const showcaseImages = useQuery(api.showcase.list);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(() => {
    if (!showcaseImages) return [];
    return Array.from(new Set(showcaseImages.map((img) => img.category)));
  }, [showcaseImages]);

  const filteredImages = useMemo(() => {
    if (!showcaseImages) return [];
    if (selectedCategory === "all") return showcaseImages;
    return showcaseImages.filter((img) => img.category === selectedCategory);
  }, [selectedCategory, showcaseImages]);

  if (showcaseImages === undefined) {
    return (
      <div className="max-w-6xl mx-auto py-16 flex items-center justify-center text-muted">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-5 py-2.5 rounded-full border text-sm font-semibold transition-colors ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-card-border hover:bg-surface-2"
            }`}
          >
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full border text-sm font-semibold transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-card-border hover:bg-surface-2"
              }`}
            >
              {(CATEGORY_LABELS as Record<string, string>)[cat] ?? cat}
            </button>
          ))}
        </div>

        {filteredImages.length === 0 ? (
          <div className="rounded-2xl border border-card-border bg-surface-1 p-10 text-center text-muted">
            لا توجد صور في المعرض حالياً.
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
            {filteredImages.map((img, idx) => (
              <article
                key={img._id}
                className="mb-5 break-inside-avoid rounded-2xl overflow-hidden border border-card-border bg-surface-1 shadow-sm hover:shadow-xl transition-shadow"
              >
                <div className={`relative w-full ${ASPECTS[idx % ASPECTS.length]}`}>
                  {img.url ? (
                    <Image
                      src={img.url}
                      alt={img.title || "Showcase image"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-2" />
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {(CATEGORY_LABELS as Record<string, string>)[img.category] ?? img.category}
                  </div>
                </div>
                {img.title && (
                  <p className="px-4 py-3 text-sm text-muted font-medium truncate">{img.title}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
