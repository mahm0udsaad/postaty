"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTOPLAY_MS = 3800;
const PAUSE_AFTER_INTERACTION_MS = 7000;

export function ShowcaseCarousel() {
  const showcaseImages = useQuery(api.showcase.list);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const lastInteractionRef = useRef(0);
  const activeIndexRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const images = showcaseImages ?? [];
  const currentIndex = images.length
    ? ((activeIndex % images.length) + images.length) % images.length
    : 0;

  const isSectionInViewport = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return false;

    const rect = section.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
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

      const {
        behavior = "smooth",
        syncState = true,
        markInteraction = true,
        requireVisible = false,
      } = options ?? {};

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
        behavior,
        inline: "center",
        block: "nearest",
      });
      if (syncState) {
        setActiveIndex(normalized);
      }
    },
    [images.length, isSectionInViewport]
  );

  const goNext = () => scrollToIndex(currentIndex + 1);
  const goPrev = () => scrollToIndex(currentIndex - 1);

  useEffect(() => {
    activeIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, images.length);

    if (!images.length) return;
    const initialIndex = activeIndexRef.current >= images.length ? 0 : activeIndexRef.current;
    const node = cardRefs.current[initialIndex];
    if (!node || !isSectionInViewport()) return;
    node.scrollIntoView({
      behavior: "auto",
      inline: "center",
      block: "nearest",
    });
  }, [images.length, isSectionInViewport]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !images.length) return;

    let ticking = false;

    const syncActiveFromScroll = () => {
      const containerRect = el.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      cardRefs.current.forEach((card, idx) => {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(cardCenter - containerCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = idx;
        }
      });

      setActiveIndex((prev) => (prev === nearestIndex ? prev : nearestIndex));
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(syncActiveFromScroll);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => el.removeEventListener("scroll", onScroll);
  }, [images.length]);

  useEffect(() => {
    if (!images.length) return;

    const timer = setInterval(() => {
      const isRecentlyInteracted = Date.now() - lastInteractionRef.current < PAUSE_AFTER_INTERACTION_MS;
      if (isHovered || isRecentlyInteracted) return;
      scrollToIndex(activeIndexRef.current + 1, {
        markInteraction: false,
        requireVisible: true,
      });
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [isHovered, images.length, scrollToIndex]);

  if (!images.length) return null;

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-4 border-t border-card-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            أمثلة من <span className="text-gradient">إبداعات عملائنا</span>
          </h2>
          <p className="text-muted text-lg">تصاميم حقيقية تم إنشاؤها بالذكاء الاصطناعي</p>
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
            aria-label="السابق"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-surface-1/90 backdrop-blur-sm border border-card-border rounded-full items-center justify-center text-muted hover:text-foreground shadow-lg"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={goNext}
            aria-label="التالي"
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
                key={img._id}
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
                key={`dot-${img._id}`}
                onClick={() => scrollToIndex(idx)}
                aria-label={`انتقل إلى العنصر ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all ${idx === currentIndex ? "w-6 bg-primary" : "w-2.5 bg-card-border hover:bg-muted"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
