"use client";

import { Megaphone, XCircle, RotateCcw } from "lucide-react";
import type { MarketingContent, MarketingContentStatus } from "@/lib/types";
import { PLATFORMS } from "./platform-cards/platform-config";
import { PlatformCard } from "./platform-cards/platform-card";
import { PlatformCardSkeleton } from "./platform-cards/platform-card-skeleton";

export function MarketingContentPanel({
  content,
  status,
  posterImage,
  businessName,
  businessLogo,
  onRetry,
  t,
}: {
  content: MarketingContent | null;
  status: MarketingContentStatus;
  posterImage?: string;
  businessName?: string;
  businessLogo?: string;
  onRetry?: () => void;
  t: (ar: string, en: string) => string;
}) {
  if (status === "idle") return null;

  return (
    <div className="space-y-4 mt-6">
      {/* Section header */}
      <div className="flex items-center gap-3 px-2">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <Megaphone size={18} className="text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">
            {t("محتوى تسويقي جاهز للنشر", "Ready-to-publish Marketing Content")}
          </h3>
          <p className="text-xs text-muted">
            {t("انسخ والصق مباشرة في منصتك المفضلة", "Copy and paste directly to your favorite platform")}
          </p>
        </div>
      </div>

      {status === "generating" && (
        <>
          {/* Mobile: horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory md:hidden px-1 -mx-1">
            {PLATFORMS.map((p, i) => (
              <div key={p.id} className="snap-center shrink-0 w-[260px]">
                <PlatformCardSkeleton platform={p} index={i} />
              </div>
            ))}
          </div>
          {/* Desktop: 3x2 grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLATFORMS.map((p, i) => (
              <PlatformCardSkeleton key={p.id} platform={p} index={i} />
            ))}
          </div>
        </>
      )}

      {status === "complete" && content && (
        <>
          {/* Mobile: horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory md:hidden px-1 -mx-1">
            {PLATFORMS.map((p, i) => (
              <div key={p.id} className="snap-center shrink-0 w-[260px]">
                <PlatformCard platform={p} content={content} posterImage={posterImage} businessName={businessName} businessLogo={businessLogo} index={i} t={t} />
              </div>
            ))}
          </div>
          {/* Desktop: 3x2 grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLATFORMS.map((p, i) => (
              <PlatformCard key={p.id} platform={p} content={content} posterImage={posterImage} index={i} t={t} />
            ))}
          </div>
        </>
      )}

      {status === "error" && (
        <div role="alert" className="flex flex-col items-center justify-center gap-3 py-6 text-muted text-sm bg-surface-1 rounded-2xl border border-card-border">
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-danger" />
            <span>{t("تعذر إنشاء المحتوى التسويقي.", "Failed to generate marketing content.")}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <RotateCcw size={14} />
              {t("إعادة المحاولة", "Retry")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
