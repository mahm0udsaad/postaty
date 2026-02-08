"use client";

import { useState } from "react";
import type { OnlineFormData, OutputFormat, CampaignType } from "@/lib/types";
import { ONLINE_CTA_OPTIONS, ONLINE_HEADLINE_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";

interface OnlineFormProps {
  onSubmit: (data: OnlineFormData) => void;
  isLoading: boolean;
}

export function OnlineForm({ onSubmit, isLoading }: OnlineFormProps) {
  const [logo, setLogo] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [formats, setFormats] = useState<OutputFormat[]>(["instagram-square"]);
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!logo || !productImage) return;

    onSubmit({
      category: "online",
      campaignType,
      shopName: fd.get("shopName") as string,
      logo,
      productImage,
      productName: fd.get("productName") as string,
      price: fd.get("price") as string,
      discount: (fd.get("discount") as string) || undefined,
      shipping: fd.get("shipping") as "free" | "paid",
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
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">اسم المحل</label>
            <input
              name="shopName"
              required
              className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
              placeholder="مثال: متجر نون"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">اسم المنتج</label>
            <input
              name="productName"
              required
              className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
              placeholder="مثال: سماعات أيربودز"
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/80">السعر</label>
              <input
                name="price"
                required
                className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
                placeholder="199 ر.س"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/80">خصم (اختياري)</label>
              <input
                name="discount"
                className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
                placeholder="مثال: 30%"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground/80">الشحن</label>
            <div className="relative">
              <select
                name="shipping"
                required
                className="w-full px-5 py-3.5 rounded-xl border border-card-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
              >
                <option value="free">مجاني</option>
                <option value="paid">مدفوع</option>
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
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
                {ONLINE_HEADLINE_OPTIONS.map((opt) => (
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
                {ONLINE_CTA_OPTIONS.map((opt) => (
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
          <ImageUpload label="لوجو المحل" value={logo} onChange={setLogo} />
          <ImageUpload label="صورة المنتج" value={productImage} onChange={setProductImage} />
          <FormatSelector selected={formats} onChange={setFormats} />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading || !logo || !productImage}
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
