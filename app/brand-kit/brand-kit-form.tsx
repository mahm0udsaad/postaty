"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useLocale } from "@/hooks/use-locale";
import { X, Loader2, Image as ImageIcon } from "lucide-react";

interface BrandKitFormProps {
  redirectTo?: string;
  existingKit?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    instructions?: string | null;
    isDefault: boolean;
  };
}

export function BrandKitForm({ existingKit, redirectTo }: BrandKitFormProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [name, setName] = useState(existingKit?.name ?? "");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    existingKit?.logoUrl ?? null
  );
  const [instructions, setInstructions] = useState(
    existingKit?.instructions ?? ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
      reader.onload = () => {
        const base64 = reader.result as string;
        setLogoBase64(base64);
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    },
    [t]
  );

  const handleRemoveLogo = () => {
    setLogoBase64(null);
    setLogoPreview(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveMessage({
        type: "error",
        text: t("يرجى إدخال اسم العلامة التجارية", "Please enter your brand name"),
      });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      let logoUrl: string | undefined = existingKit?.logoUrl ?? undefined;

      if (logoBase64) {
        const uploadRes = await fetch("/api/storage/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64: logoBase64,
            bucket: "brand-kits",
            prefix: "logo",
          }),
        });
        if (!uploadRes.ok) throw new Error("Failed to upload logo");
        const { publicUrl } = await uploadRes.json();
        logoUrl = publicUrl;
      }

      const payload = {
        id: existingKit?.id,
        name: name.trim(),
        logoUrl,
        instructions: instructions.trim() || null,
        isDefault: true,
      };

      const res = await fetch("/api/brand-kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save brand kit");

      mutate("/api/brand-kits");

      setSaveMessage({
        type: "success",
        text: t("تم حفظ هوية العلامة التجارية بنجاح", "Brand identity saved successfully"),
      });
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (err) {
      setSaveMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : t("حدث خطأ أثناء الحفظ", "An error occurred while saving"),
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
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-card-border rounded-2xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all bg-surface-1/50 shrink-0">
              <ImageIcon size={24} className="text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">
                {t("رفع الشعار", "Upload logo")}
              </span>
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

      {/* Instructions */}
      <section className="rounded-2xl border border-card-border/70 bg-surface-1/40 p-4 md:p-5">
        <label className="block text-sm font-bold text-foreground mb-2">
          {t("تعليمات التصميم", "Design instructions")}
          <span className="text-muted-foreground font-normal ms-2">
            {t("(اختياري)", "(optional)")}
          </span>
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={t(
            "مثال: استخدم ألوان دافئة، تجنب الصور الكرتونية، الأسلوب الفاخر والراقي...",
            "Example: Use warm colors, avoid cartoon images, luxury and elegant style..."
          )}
          rows={5}
          className="w-full px-4 py-3 bg-surface-1 rounded-xl border border-card-border focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/40 transition-all placeholder:text-muted/50 resize-none text-sm leading-relaxed"
        />
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
