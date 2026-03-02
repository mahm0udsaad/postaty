"use client";

import { Square, Smartphone, Monitor, Image, MessageCircle } from "lucide-react";
import type { OutputFormat } from "@/lib/types";
import { POSTER_GENERATION_FORMATS } from "@/lib/constants";
import { useLocale } from "@/hooks/use-locale";

interface FormatSelectorProps {
  selected: OutputFormat;
  onChange: (format: OutputFormat) => void;
}

const formatIcons: Record<OutputFormat, typeof Square> = {
  "instagram-square": Square,
  "instagram-story": Smartphone,
  "facebook-post": Monitor,
  "facebook-cover": Image,
  "twitter-post": Monitor,
  "whatsapp-status": MessageCircle,
};

const FORMAT_COPY: Record<OutputFormat, { ar: string; en: string; ratio: string }> = {
  "instagram-square": { ar: "انستجرام بوست", en: "Instagram Post", ratio: "3:4" },
  "instagram-story": { ar: "انستجرام ستوري", en: "Instagram Story", ratio: "9:16" },
  "facebook-post": { ar: "فيسبوك بوست", en: "Facebook Post", ratio: "4:5" },
  "facebook-cover": { ar: "غلاف فيسبوك", en: "Facebook Cover", ratio: "16:9" },
  "twitter-post": { ar: "تويتر / X", en: "X / Twitter", ratio: "16:9" },
  "whatsapp-status": { ar: "حالة واتساب", en: "WhatsApp Status", ratio: "9:16" },
};

export function FormatSelector({ selected, onChange }: FormatSelectorProps) {
  const { locale, t } = useLocale();

  const select = (format: OutputFormat) => {
    onChange(format);
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-3 text-foreground/80">
        {t("اختر حجم المنشور", "Select post size")}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3">
        {POSTER_GENERATION_FORMATS.map((format) => {
          const Icon = formatIcons[format];
          const isSelected = selected === format;
          const copy = FORMAT_COPY[format];

          return (
            <button
              key={format}
              type="button"
              onClick={() => select(format)}
              className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200
                ${isSelected
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary ring-offset-2"
                  : "border-card-border text-muted-foreground hover:border-primary/30 hover:bg-surface-2"}`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/10" : "bg-surface-2"}`}>
                <Icon size={24} />
              </div>
              <div className="text-center">
                <span className="block text-xs font-bold mb-1 text-foreground">{locale === "ar" ? copy.ar : copy.en}</span>
                <span className="block text-[10px] opacity-70 bg-surface-2 px-2 py-0.5 rounded-full border border-card-border">{copy.ratio}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
