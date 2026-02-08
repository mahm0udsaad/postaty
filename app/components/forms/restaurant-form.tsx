"use client";

import { useState } from "react";
import type { RestaurantFormData, OutputFormat, CampaignType } from "@/lib/types";
import { RESTAURANT_CTA_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";

interface RestaurantFormProps {
  onSubmit: (data: RestaurantFormData) => void;
  isLoading: boolean;
}

export function RestaurantForm({ onSubmit, isLoading }: RestaurantFormProps) {
  const [logo, setLogo] = useState<string | null>(null);
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [formats, setFormats] = useState<OutputFormat[]>(["instagram-square"]);
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!logo || !mealImage) return;

    onSubmit({
      category: "restaurant",
      campaignType,
      restaurantName: fd.get("restaurantName") as string,
      logo,
      mealImage,
      mealName: fd.get("mealName") as string,
      newPrice: fd.get("newPrice") as string,
      oldPrice: fd.get("oldPrice") as string,
      offerDuration: (fd.get("offerDuration") as string) || undefined,
      whatsapp: fd.get("whatsapp") as string,
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
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">اسم المطعم</label>
            <input
              name="restaurantName"
              required
              className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
              placeholder="مثال: مطعم الشام"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">اسم الوجبة</label>
            <input
              name="mealName"
              required
              className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
              placeholder="مثال: شاورما دجاج"
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/80">السعر الجديد</label>
              <input
                name="newPrice"
                required
                className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
                placeholder="25 ر.س"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/80">السعر القديم</label>
              <input
                name="oldPrice"
                required
                className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
                placeholder="40 ر.س"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">مدة العرض (اختياري)</label>
            <input
              name="offerDuration"
              className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
              placeholder="مثال: حتى نهاية الأسبوع"
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
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">نص الزر (CTA)</label>
            <div className="relative">
              <select
                name="cta"
                required
                className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
              >
                {RESTAURANT_CTA_OPTIONS.map((opt) => (
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
          <ImageUpload label="لوجو المطعم" value={logo} onChange={setLogo} />
          <ImageUpload label="صورة الوجبة" value={mealImage} onChange={setMealImage} />
          <FormatSelector selected={formats} onChange={setFormats} />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading || !logo || !mealImage}
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
