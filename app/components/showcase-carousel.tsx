"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";

const AUTOPLAY_MS = 3800;
const PAUSE_AFTER_INTERACTION_MS = 7000;

type ShowcaseImage = {
  id: string;
  _id?: string;
  url?: string | null;
  title?: string | null;
  category?: string | null;
};

type ShowcaseCarouselProps = {
  showcaseImages: readonly ShowcaseImage[] | undefined;
};

export function ShowcaseCarousel({ showcaseImages }: ShowcaseCarouselProps) {
  const { t } = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const lastInteractionRef = useRef(0);
  const activeIndexRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  const images = showcaseImages ?? [];
  const currentIndex = images.length
    ? ((activeIndex % images.length) + images.length) % images.length
    : 0;

  const isSectionInViewport = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return false;

    const rect = section.getBoundingClientRect();
    // Gate autoplay to when this section is truly in focus, not merely touching the viewport.
    const viewportHeight = window.innerHeight;
    const sectionMidpoint = rect.top + rect.height / 2;
    const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    const visibleRatio = Math.max(0, visibleHeight) / Math.max(rect.height, 1);

    return sectionMidpoint > 0 && sectionMidpoint < viewportHeight && visibleRatio >= 0.45;
  }, []);

  const scrollToIndex = useCallback(
    (
      index: number,
      options?: {
        behavior?: ScrollBehavior;
        syncState?: boolean;
        markInteraction?: boolean;
        requireVisible?: boolean;
      }
    ) => {
      if (!images.length) return;

      const { syncState = true, markInteraction = true, requireVisible = false } = options ?? {};

      if (requireVisible && !isSectionInViewport()) {
        return;
      }

      const normalized = (index + images.length) % images.length;
      const node = cardRefs.current[normalized];
      if (!node) return;

      if (markInteraction) {
        lastInteractionRef.current = Date.now();
      }
      node.scrollIntoView({
        behavior: options?.behavior ?? (isCoarsePointer ? "auto" : "smooth"),
        inline: "center",
        block: "nearest",
      });
      if (syncState) {
        setActiveIndex(normalized);
      }
    },
    [images.length, isSectionInViewport, isCoarsePointer]
  );

  const goNext = () => scrollToIndex(currentIndex + 1);
  const goPrev = () => scrollToIndex(currentIndex - 1);

  useEffect(() => {
    activeIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, images.length);
  }, [images.length]);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const sync = () => setIsCoarsePointer(media.matches);
    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !images.length) return;

    const bestRatioByIndex = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = cardRefs.current.findIndex((card) => card === entry.target);
          if (idx >= 0) {
            bestRatioByIndex.set(idx, entry.intersectionRatio);
          }
        });

        let bestIndex = activeIndexRef.current;
        let bestRatio = -1;
        bestRatioByIndex.forEach((ratio, idx) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = idx;
          }
        });

        if (bestRatio >= 0) {
          setActiveIndex((prev) => (prev === bestIndex ? prev : bestIndex));
        }
      },
      { root, threshold: [0.35, 0.5, 0.65, 0.8, 0.95] }
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, [images.length]);

  useEffect(() => {
    if (!images.length || isCoarsePointer) return;

    const timer = setInterval(() => {
      const isRecentlyInteracted = Date.now() - lastInteractionRef.current < PAUSE_AFTER_INTERACTION_MS;
      if (isHovered || isRecentlyInteracted) return;
      scrollToIndex(activeIndexRef.current + 1, {
        markInteraction: false,
        requireVisible: true,
      });
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [isHovered, images.length, scrollToIndex, isCoarsePointer]);

  // Show skeleton while Convex is loading (useQuery returns undefined)
  if (showcaseImages === undefined) {
    return (
      <section className="py-16 md:py-24 px-4 border-t border-card-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="h-10 w-64 bg-surface-2 rounded-xl mx-auto mb-4 animate-pulse" />
            <div className="h-5 w-48 bg-surface-2 rounded-lg mx-auto animate-pulse" />
          </div>
          <div className="flex gap-4 md:gap-6 overflow-hidden pb-4 px-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-[250px] md:w-[300px]">
                <div className="rounded-2xl border border-card-border bg-surface-1 w-full aspect-square animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!images.length) return null;

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-4 border-t border-card-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {t("أمثلة من", "Examples of")} <span className="text-gradient">{t("إبداعات عملائنا", "our customers' creations")}</span>
          </h2>
          <p className="text-muted text-lg">{t("تصاميم حقيقية تم إنشاؤها بالذكاء الاصطناعي", "Real designs generated with AI")}</p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onPointerDown={() => {
            lastInteractionRef.current = Date.now();
          }}
        >
          <button
            onClick={goPrev}
            aria-label={t("السابق", "Previous")}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-surface-1/90 backdrop-blur-sm border border-card-border rounded-full items-center justify-center text-muted hover:text-foreground shadow-lg"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={goNext}
            aria-label={t("التالي", "Next")}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-surface-1/90 backdrop-blur-sm border border-card-border rounded-full items-center justify-center text-muted hover:text-foreground shadow-lg"
          >
            <ChevronLeft size={20} />
          </button>

          <div
            ref={scrollRef}
            dir="rtl"
            onTouchStart={() => {
              lastInteractionRef.current = Date.now();
            }}
            onWheel={() => {
              lastInteractionRef.current = Date.now();
            }}
            className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 px-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {images.map((img, idx) => (
              <article
                key={img.id ?? img._id}
                ref={(node) => {
                  cardRefs.current[idx] = node;
                }}
                className="flex-shrink-0 w-[250px] md:w-[300px] snap-center"
              >
                <div className="relative rounded-2xl overflow-hidden border border-card-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-surface-1">
                  {img.url ? (
                    <Image
                      src={img.url}
                      alt={img.title || "Showcase poster"}
                      width={600}
                      height={600}
                      sizes="(max-width: 768px) 250px, 300px"
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-surface-2 flex items-center justify-center text-muted text-sm">
                      Loading...
                    </div>
                  )}

                  {img.category && (
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {img.category}
                    </div>
                  )}
                </div>
                {img.title && (
                  <p className="mt-2 text-sm text-muted text-center font-medium truncate">{img.title}</p>
                )}
              </article>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-center gap-1.5">
            {images.map((img, idx) => (
              <button
                key={`dot-${img.id ?? img._id}`}
                onClick={() => scrollToIndex(idx)}
                aria-label={`${t("انتقل إلى العنصر", "Go to item")} ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all ${idx === currentIndex ? "w-6 bg-primary" : "w-2.5 bg-card-border hover:bg-muted"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
