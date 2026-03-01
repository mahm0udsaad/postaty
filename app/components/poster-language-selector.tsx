"use client";

import { useState, useEffect } from "react";
import { Languages } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import type { PosterLanguage } from "@/lib/types";

const STORAGE_KEY = "postaty-poster-language";

const LANGUAGE_OPTIONS: {
  value: PosterLanguage;
  ar: string;
  en: string;
}[] = [
  { value: "ar", ar: "العربية", en: "Arabic" },
  { value: "en", ar: "الإنجليزية", en: "English" },
  { value: "fr", ar: "الفرنسية", en: "French" },
  { value: "de", ar: "الألمانية", en: "German" },
  { value: "tr", ar: "التركية", en: "Turkish" },
  { value: "other", ar: "أخرى", en: "Other" },
];

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  ar: "Arabic",
  en: "English",
  fr: "French",
  de: "German",
  tr: "Turkish",
};

interface PosterLanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

function getInitialLanguage(locale: "ar" | "en"): string {
  if (typeof window === "undefined") return locale === "ar" ? "ar" : "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored || (locale === "ar" ? "ar" : "en");
}

export function usePosterLanguage() {
  const { locale } = useLocale();
  const [posterLanguage, setPosterLanguage] = useState(() => getInitialLanguage(locale));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, posterLanguage);
  }, [posterLanguage]);

  return [posterLanguage, setPosterLanguage] as const;
}

export function PosterLanguageSelector({ value, onChange }: PosterLanguageSelectorProps) {
  const { locale, t } = useLocale();
  const isKnown = LANGUAGE_OPTIONS.some((o) => o.value === value);
  const selectedOption = isKnown ? value : "other";
  const customValue = isKnown ? "" : value;

  const handleSelectChange = (next: PosterLanguage) => {
    if (next === "other") {
      onChange("");
    } else {
      onChange(next);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Languages size={16} className="text-muted shrink-0" />
        <label className="text-sm font-medium text-foreground/80">
          {t("لغة التصميم", "Design language")}
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {LANGUAGE_OPTIONS.map((opt) => {
          const isActive = selectedOption === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelectChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                isActive
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-card-border bg-surface-1 text-muted hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {locale === "ar" ? opt.ar : opt.en}
            </button>
          );
        })}
      </div>
      {selectedOption === "other" && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("اكتب اللغة (مثال: Español)", "Type the language (e.g., Español)")}
          className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-surface-1 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
          autoFocus
        />
      )}
    </div>
  );
}
