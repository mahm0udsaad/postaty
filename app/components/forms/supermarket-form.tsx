"use client";

import { useState } from "react";
import type { SupermarketFormData, OutputFormat, CampaignType } from "@/lib/types";
import {
  SUPERMARKET_CTA_OPTIONS,
  SUPERMARKET_HEADLINE_OPTIONS,
} from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { MultiImageUpload } from "../multi-image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";

interface SupermarketFormProps {
  onSubmit: (data: SupermarketFormData) => void;
  isLoading: boolean;
}

export function SupermarketForm({ onSubmit, isLoading }: SupermarketFormProps) {
  const [logo, setLogo] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [formats, setFormats] = useState<OutputFormat[]>(["instagram-square"]);
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!logo || productImages.length === 0) return;

    onSubmit({
      category: "supermarket",
      campaignType,
      supermarketName: fd.get("supermarketName") as string,
      logo,
      productName: fd.get("productName") as string,
      productImages,
      weight: (fd.get("weight") as string) || undefined,
      offerDuration: (fd.get("offerDuration") as string) || undefined,
      whatsapp: fd.get("whatsapp") as string,
      headline: fd.get("headline") as string,
      cta: fd.get("cta") as string,
      formats,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <CampaignTypeSelector value={campaignType} onChange={setCampaignType} />
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">اسم السوبر ماركت</label>
            <input
              name="supermarketName"
              required
              className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
              placeholder="مثال: كارفور"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">اسم المنتج</label>
            <input
              name="productName"
              required
              className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
              placeholder="مثال: شيبسي ليز"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">الوزن أو الحجم (اختياري)</label>
            <input
              name="weight"
              className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
              placeholder="مثال: 200 جرام"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">مدة العرض (اختياري)</label>
            <input
              name="offerDuration"
              className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
              placeholder="مثال: من 1 إلى 7 فبراير"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">رقم الواتساب</label>
            <input
              name="whatsapp"
              required
              type="tel"
              dir="ltr"
              className="w-full px-5 py-3.5 rounded-xl border border-card-border bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50 text-left"
              placeholder="+966xxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">نص العرض</label>
            <div className="relative">
              <select
                name="headline"
                required
                className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
              >
                {SUPERMARKET_HEADLINE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">نص الزر (CTA)</label>
            <div className="relative">
              <select
                name="cta"
                required
                className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
              >
                {SUPERMARKET_CTA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <ImageUpload label="لوجو السوبر ماركت" value={logo} onChange={setLogo} />
          <MultiImageUpload
            label="صور المنتج (يمكن رفع أكثر من صورة)"
            values={productImages}
            onChange={setProductImages}
          />
          <FormatSelector selected={formats} onChange={setFormats} />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading || !logo || productImages.length === 0}
        className="w-full py-4 bg-gradient-to-r from-primary to-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-lg"
      >
        {isLoading ? (
            <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                جاري الإنشاء...
            </span>
        ) : "إنشاء البوستر"}
      </button>
    </form>
  );
}
