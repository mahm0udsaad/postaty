"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import type { BrandPalette, StyleAdjective } from "@/lib/types";
import { STYLE_ADJECTIVE_OPTIONS } from "@/lib/constants";
import { extractColorsFromImage } from "@/lib/brand-extraction";
import { useLocale } from "@/hooks/use-locale";
import {
  X,
  Plus,
  Check,
  Loader2,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

const FONT_OPTIONS = [
  "Noto Kufi Arabic",
  "Cairo",
  "Tajawal",
  "Almarai",
  "IBM Plex Arabic",
  "Amiri",
];

const PALETTE_LABELS: Record<keyof BrandPalette, { ar: string; en: string }> = {
  primary: { ar: "اللون الأساسي", en: "Primary color" },
  secondary: { ar: "اللون الثانوي", en: "Secondary color" },
  accent: { ar: "لون التمييز", en: "Accent color" },
  background: { ar: "لون الخلفية", en: "Background color" },
  text: { ar: "لون النص", en: "Text color" },
};

const DEFAULT_PALETTE: BrandPalette = {
  primary: "#4f46e5",
  secondary: "#8b5cf6",
  accent: "#10b981",
  background: "#f8fafc",
  text: "#1e293b",
};

interface BrandKitFormProps {
  redirectTo?: string;
  existingKit?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    palette: BrandPalette;
    extractedColors: string[];
    fontFamily: string;
    styleAdjectives: string[];
    doRules: string[];
    dontRules: string[];
    isDefault: boolean;
  };
}

export function BrandKitForm({ existingKit, redirectTo }: BrandKitFormProps) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [name, setName] = useState(existingKit?.name ?? "");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    existingKit?.logoUrl ?? null
  );
  const [extractedColors, setExtractedColors] = useState<string[]>(
    existingKit?.extractedColors ?? []
  );
  const [palette, setPalette] = useState<BrandPalette>(
    existingKit?.palette ?? DEFAULT_PALETTE
  );
  const [fontFamily, setFontFamily] = useState(
    existingKit?.fontFamily ?? "Noto Kufi Arabic"
  );
  const [selectedAdjectives, setSelectedAdjectives] = useState<
    StyleAdjective[]
  >((existingKit?.styleAdjectives ?? []) as StyleAdjective[]);
  const [doRules, setDoRules] = useState<string[]>(
    existingKit?.doRules ?? [""]
  );
  const [dontRules, setDontRules] = useState<string[]>(
    existingKit?.dontRules ?? [""]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) {
        setSaveMessage({
          type: "error",
          text: t("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت", "Image size must not exceed 5MB"),
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setLogoBase64(base64);
        setLogoPreview(base64);

        // Extract colors
        setIsExtracting(true);
        try {
          const result = await extractColorsFromImage(base64);
          setExtractedColors(result.colors);
          setPalette(result.suggestedPalette);
        } catch {
          // Extraction failed silently, keep current palette
        }
        setIsExtracting(false);
      };
      reader.readAsDataURL(file);
    },
    [t]
  );

  const handleRemoveLogo = () => {
    setLogoBase64(null);
    setLogoPreview(null);
    setExtractedColors([]);
  };

  const handlePaletteChange = (key: keyof BrandPalette, value: string) => {
    setPalette((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAdjective = (adj: StyleAdjective) => {
    setSelectedAdjectives((prev) => {
      if (prev.includes(adj)) {
        return prev.filter((a) => a !== adj);
      }
      if (prev.length >= 5) return prev;
      return [...prev, adj];
    });
  };

  const handleRuleChange = (
    type: "do" | "dont",
    index: number,
    value: string
  ) => {
    if (type === "do") {
      setDoRules((prev) => prev.map((r, i) => (i === index ? value : r)));
    } else {
      setDontRules((prev) => prev.map((r, i) => (i === index ? value : r)));
    }
  };

  const addRule = (type: "do" | "dont") => {
    if (type === "do" && doRules.length < 10) {
      setDoRules((prev) => [...prev, ""]);
    } else if (type === "dont" && dontRules.length < 10) {
      setDontRules((prev) => [...prev, ""]);
    }
  };

  const removeRule = (type: "do" | "dont", index: number) => {
    if (type === "do") {
      setDoRules((prev) => prev.filter((_, i) => i !== index));
    } else {
      setDontRules((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveMessage({ type: "error", text: t("يرجى إدخال اسم العلامة التجارية", "Please enter your brand name") });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Upload logo if new
      let logoUrl: string | undefined = existingKit?.logoUrl ?? undefined;

      if (logoBase64) {
        const uploadRes = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: logoBase64,
            bucket: 'brand-kits',
            prefix: 'logo',
          }),
        });
        if (!uploadRes.ok) throw new Error('Failed to upload logo');
        const { publicUrl } = await uploadRes.json();
        logoUrl = publicUrl;
      }

      // Filter empty rules
      const cleanDoRules = doRules.filter((r) => r.trim());
      const cleanDontRules = dontRules.filter((r) => r.trim());

      const payload = {
        id: existingKit?.id,
        name: name.trim(),
        logoUrl,
        palette,
        extractedColors,
        fontFamily,
        styleAdjectives: selectedAdjectives,
        doRules: cleanDoRules,
        dontRules: cleanDontRules,
        isDefault: true,
      };

      const res = await fetch('/api/brand-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save brand kit');

      // Revalidate SWR cache
      mutate('/api/brand-kits');

      setSaveMessage({ type: "success", text: t("تم حفظ هوية العلامة التجارية بنجاح", "Brand identity saved successfully") });
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (err) {
      setSaveMessage({
        type: "error",
        text: err instanceof Error ? err.message : t("حدث خطأ أثناء الحفظ", "An error occurred while saving"),
      });
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Brand Name */}
      <section className="rounded-2xl border border-card-border/70 bg-surface-1/40 p-4 md:p-5">
        <label className="block text-sm font-bold text-foreground mb-2">
          {t("اسم العلامة التجارية", "Brand name")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("مثال: مطعم الشام", "Example: Nova Cafe")}
          className="w-full h-12 px-4 bg-surface-1 rounded-xl border border-card-border focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all placeholder:text-muted/50"
        />
      </section>

      {/* Logo Upload */}
      <section className="rounded-2xl border border-card-border/70 bg-surface-1/40 p-4 md:p-5">
        <label className="block text-sm font-bold text-foreground mb-3">
          {t("شعار العلامة التجارية", "Brand logo")}
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {logoPreview ? (
            <div className="relative inline-block shrink-0 w-32 h-32">
              <div className="w-32 h-32 rounded-2xl border-2 border-card-border overflow-hidden bg-surface-1 flex items-center justify-center">
                <Image
                  src={logoPreview}
                  alt={t("الشعار", "Logo")}
                  fill
                  sizes="128px"
                  className="object-contain"
                  unoptimized
                />
              </div>
              <button
                onClick={handleRemoveLogo}
                className="absolute -top-2 -left-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center shadow-md hover:bg-danger/90 transition-colors"
              >
                <X size={14} />
              </button>
              {isExtracting && (
                <div className="absolute inset-0 bg-surface-1/80 rounded-2xl flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-card-border rounded-2xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all bg-surface-1/50 shrink-0">
              <ImageIcon size={24} className="text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">{t("رفع الشعار", "Upload logo")}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          )}
          <div className="text-xs text-muted space-y-1">
            <p>{t("صيغة مناسبة: PNG, JPG, SVG", "Accepted formats: PNG, JPG, SVG")}</p>
            <p>{t("الحد الأقصى للحجم: 5MB", "Maximum size: 5MB")}</p>
          </div>
        </div>
      </section>

      {/* Extracted Colors */}
      {extractedColors.length > 0 && (
        <section className="rounded-2xl border border-card-border/70 bg-surface-1/40 p-4 md:p-5">
          <label className="block text-sm font-bold text-foreground mb-2">
            {t("الألوان المستخرجة من الشعار", "Extracted colors from logo")}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {extractedColors.map((color, i) => (
              <button
                key={i}
                onClick={() =>
                  handlePaletteChange("primary", color)
                }
                className="w-10 h-10 rounded-xl border-2 border-card-border hover:border-primary/50 hover:scale-110 transition-all shadow-sm"
                style={{ backgroundColor: color }}
                title={t(`استخدم ${color} كلون أساسي`, `Use ${color} as primary color`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Palette Editor */}
      <section className="rounded-2xl border border-card-border/70 bg-surface-1/40 p-4 md:p-5">
        <label className="block text-sm font-bold text-foreground mb-3">
          {t("لوحة الألوان", "Color palette")}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(PALETTE_LABELS) as (keyof BrandPalette)[]).map(
            (key) => (
              <div key={key} className="space-y-2 rounded-xl border border-card-border/70 bg-surface-1 p-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {PALETTE_LABELS[key][locale]}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={palette[key]}
                    onChange={(e) => handlePaletteChange(key, e.target.value)}
                    className="w-11 h-11 rounded-lg border border-card-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={palette[key]}
                    onChange={(e) => handlePaletteChange(key, e.target.value)}
                    className="flex-1 h-11 px-3 bg-surface-1 rounded-lg border border-card-border text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all"
                    maxLength={7}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* Font Family */}
      <section className="rounded-2xl border border-card-border/70 bg-surface-1/40 p-4 md:p-5">
        <label className="block text-sm font-bold text-foreground mb-2">
          {t("الخط المستخدم", "Font family")}
        </label>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="w-full h-12 px-4 bg-surface-1 rounded-xl border border-card-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all"
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font} className="bg-surface-1 text-foreground">
              {font}
            </option>
          ))}
        </select>
      </section>

      {/* Style Adjectives */}
      <section className="rounded-2xl border border-card-border/70 bg-surface-1/40 p-4 md:p-5">
        <label className="block text-sm font-bold text-foreground mb-2">
          {t("أسلوب العلامة", "Brand style")}{" "}
          <span className="text-muted-foreground font-normal">
            {t("(اختر حتى 5)", "(Choose up to 5)")}
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {STYLE_ADJECTIVE_OPTIONS.map((option) => {
            const isSelected = selectedAdjectives.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => toggleAdjective(option.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-surface-1 border border-card-border text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-surface-2"
                } ${
                  !isSelected && selectedAdjectives.length >= 5
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={!isSelected && selectedAdjectives.length >= 5}
              >
                {isSelected && <Check size={14} className="inline ml-1" />}
                {locale === "ar" ? option.labelAr : option.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Do Rules */}
      <section className="rounded-2xl border border-card-border/70 bg-surface-1/40 p-4 md:p-5">
        <label className="block text-sm font-bold text-foreground mb-2">
          {t("قواعد التصميم (افعل)", "Design rules (Do)")}
        </label>
        <div className="space-y-2">
          {doRules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={rule}
                onChange={(e) => handleRuleChange("do", i, e.target.value)}
                placeholder={t("مثال: استخدم ألوان دافئة", "Example: Use warm colors")}
                className="flex-1 h-11 px-4 bg-surface-1 rounded-xl border border-card-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all placeholder:text-muted/50"
              />
              {doRules.length > 1 && (
                <button
                  onClick={() => removeRule("do", i)}
                  className="h-11 w-11 rounded-xl border border-card-border text-muted-foreground hover:text-danger hover:border-danger/50 transition-colors flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          {doRules.length < 10 && (
            <button
              onClick={() => addRule("do")}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Plus size={16} />
              {t("إضافة قاعدة", "Add rule")}
            </button>
          )}
        </div>
      </section>

      {/* Don't Rules */}
      <section className="rounded-2xl border border-card-border/70 bg-surface-1/40 p-4 md:p-5">
        <label className="block text-sm font-bold text-foreground mb-2">
          {t("قواعد التصميم (لا تفعل)", "Design rules (Don't)")}
        </label>
        <div className="space-y-2">
          {dontRules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={rule}
                onChange={(e) => handleRuleChange("dont", i, e.target.value)}
                placeholder={t("مثال: لا تستخدم صور كرتونية", "Example: Don't use cartoon images")}
                className="flex-1 h-11 px-4 bg-surface-1 rounded-xl border border-card-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all placeholder:text-muted/50"
              />
              {dontRules.length > 1 && (
                <button
                  onClick={() => removeRule("dont", i)}
                  className="h-11 w-11 rounded-xl border border-card-border text-muted-foreground hover:text-danger hover:border-danger/50 transition-colors flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          {dontRules.length < 10 && (
            <button
              onClick={() => addRule("dont")}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Plus size={16} />
              {t("إضافة قاعدة", "Add rule")}
            </button>
          )}
        </div>
      </section>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium ${
            saveMessage.type === "success"
              ? "bg-success/10 text-success border border-success/30"
              : "bg-danger/10 text-danger border border-danger/30"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin" />
            {t("جاري الحفظ...", "Saving...")}
          </span>
        ) : (
          t("حفظ هوية العلامة التجارية", "Save brand identity")
        )}
      </button>
    </div>
  );
}
