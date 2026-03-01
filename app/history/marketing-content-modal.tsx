"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Megaphone } from "lucide-react";
import { MarketingContentHub } from "@/app/components/marketing-content-hub";
import { generateMarketingContentAction } from "@/app/actions-v2";
import type {
  MarketingContentHub as MarketingContentHubType,
  MarketingContentStatus,
  PostFormData,
} from "@/lib/types";
import { useLocale } from "@/hooks/use-locale";

interface MarketingContentModalProps {
  /** The stored form inputs JSON string from the generation record */
  inputs: string;
  /** Image URL to display in platform mockups */
  imageUrl: string;
  businessName: string;
  onClose: () => void;
}

export function MarketingContentModal({
  inputs,
  imageUrl,
  businessName,
  onClose,
}: MarketingContentModalProps) {
  const { t } = useLocale();
  const [content, setContent] = useState<MarketingContentHubType | null>(null);
  const [status, setStatus] = useState<MarketingContentStatus>("idle");
  const [error, setError] = useState<string>();
  const [language, setLanguage] = useState("auto");

  const parsedData = (() => {
    try {
      return JSON.parse(inputs) as PostFormData;
    } catch {
      return null;
    }
  })();

  const fetchContent = useCallback(
    async (lang: string) => {
      if (!parsedData) {
        setStatus("error");
        setError(
          t(
            "لا تتوفر بيانات كافية لإنشاء المحتوى التسويقي",
            "Not enough data to generate marketing content"
          )
        );
        return;
      }

      setStatus("loading");
      setError(undefined);
      try {
        const result = await generateMarketingContentAction(parsedData, lang);
        if ("error" in result) {
          setStatus("error");
          setError(result.error);
        } else {
          setContent(result.content);
          setStatus("complete");
        }
      } catch (err) {
        setStatus("error");
        setError(
          err instanceof Error
            ? err.message
            : t(
                "فشل إنشاء المحتوى التسويقي",
                "Failed to generate marketing content"
              )
        );
      }
    },
    [parsedData, t]
  );

  const handleGenerate = () => fetchContent(language);

  const handleLanguageToggle = (lang: string) => {
    if (lang === language) return;
    setLanguage(lang);
    fetchContent(lang);
  };

  const handleRetry = () => fetchContent(language);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-background rounded-2xl border border-card-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-card-border bg-background/95 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg shadow-primary/20">
              <Megaphone size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {t("محتوى تسويقي", "Marketing Content")}
              </h2>
              <p className="text-xs text-muted">{businessName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-2 rounded-lg transition-colors text-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <MarketingContentHub
            content={content}
            status={status}
            posterImageBase64={imageUrl}
            businessName={businessName}
            onGenerate={handleGenerate}
            onLanguageToggle={handleLanguageToggle}
            onRetry={handleRetry}
            error={error}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
