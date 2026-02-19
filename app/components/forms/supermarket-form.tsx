"use client";

import { useState } from "react";
import { Store, ShoppingBasket, Scale, Clock, Phone, MousePointerClick, Tag, Percent, FileText, CalendarDays, Package } from "lucide-react";
import type { SupermarketFormData, OutputFormat, CampaignType } from "@/lib/types";
import { SUPERMARKET_CTA_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { MultiImageUpload } from "../multi-image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";
import { FormInput, FormSelect } from "../ui/form-input";

interface SupermarketFormProps {
  onSubmit: (data: SupermarketFormData) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

const POST_TYPE_OPTIONS = ["منتج", "عروض يومية", "تخفيضات قسم"] as const;
const POST_TYPE_VALUES: Record<string, SupermarketFormData["postType"]> = {
  "منتج": "product",
  "عروض يومية": "daily-offers",
  "تخفيضات قسم": "section-sales",
};

export function SupermarketForm({ onSubmit, isLoading, defaultValues }: SupermarketFormProps) {
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [formats, setFormats] = useState<OutputFormat[]>(["instagram-square"]);
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!logo || productImages.length === 0) return;

    const postTypeLabel = fd.get("postType") as string;

    onSubmit({
      category: "supermarket",
      campaignType,
      supermarketName: fd.get("supermarketName") as string,
      logo,
      productImages,
      postType: POST_TYPE_VALUES[postTypeLabel] ?? "product",
      productName: fd.get("productName") as string,
      quantity: (fd.get("quantity") as string) || undefined,
      newPrice: fd.get("newPrice") as string,
      oldPrice: fd.get("oldPrice") as string,
      discountPercentage: (fd.get("discountPercentage") as string) || undefined,
      offerLimit: (fd.get("offerLimit") as string) || undefined,
      offerDuration: (fd.get("offerDuration") as string) || undefined,
      expiryDate: (fd.get("expiryDate") as string) || undefined,
      whatsapp: fd.get("whatsapp") as string,
      cta: fd.get("cta") as string,
      formats,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-surface-2 p-1 rounded-2xl border border-card-border">
            <CampaignTypeSelector value={campaignType} onChange={setCampaignType} />
          </div>

          <div className="space-y-5">
            <FormInput
                label="اسم السوبر ماركت"
                name="supermarketName"
                placeholder="مثال: كارفور"
                required
                icon={Store}
                defaultValue={defaultValues?.businessName}
            />

            <FormSelect
                label="نوع البوست"
                name="postType"
                options={POST_TYPE_OPTIONS}
                required
                icon={FileText}
            />

            <FormInput
                label="اسم المنتج"
                name="productName"
                placeholder="مثال: شيبسي ليز"
                required
                icon={ShoppingBasket}
            />

            <FormInput
                label="الكمية / الوزن (اختياري)"
                name="quantity"
                placeholder="مثال: 200 جرام أو 6 حبات"
                icon={Scale}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="السعر الجديد"
                    name="newPrice"
                    placeholder="15 ر.س"
                    required
                    icon={Tag}
                />
                <FormInput
                    label="السعر القديم"
                    name="oldPrice"
                    placeholder="25 ر.س"
                    required
                    icon={Tag}
                />
            </div>

            <FormInput
                label="نسبة الخصم (اختياري)"
                name="discountPercentage"
                placeholder="مثال: 40"
                icon={Percent}
            />

            <FormInput
                label="حد العرض (اختياري)"
                name="offerLimit"
                placeholder="مثال: 3 قطع لكل عميل"
                icon={Package}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="مدة العرض (اختياري)"
                    name="offerDuration"
                    placeholder="مثال: حتى نفاذ الكمية"
                    icon={Clock}
                />
                <FormInput
                    label="تاريخ الانتهاء (اختياري)"
                    name="expiryDate"
                    placeholder="مثال: 2025/03/15"
                    icon={CalendarDays}
                />
            </div>

            <FormInput
                label="رقم الواتساب"
                name="whatsapp"
                type="tel"
                dir="ltr"
                placeholder="+971xxxxxxxxx"
                required
                icon={Phone}
                className="text-left"
            />

            <FormSelect
                label="نص الزر (CTA)"
                name="cta"
                options={SUPERMARKET_CTA_OPTIONS}
                required
                icon={MousePointerClick}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <div className="space-y-6">
             <ImageUpload label="لوجو السوبر ماركت" value={logo} onChange={setLogoOverride} />
             <MultiImageUpload
                label="صور المنتج (يمكن رفع أكثر من صورة)"
                values={productImages}
                onChange={setProductImages}
             />
          </div>

          <div className="pt-4 border-t border-card-border">
             <FormatSelector selected={formats} onChange={setFormats} />
          </div>
        </div>
      </div>

      <div className="sticky bottom-24 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pb-4 pt-8 -mx-6 px-6 md:static md:bg-none md:p-0 md:m-0 transition-all">
        <button
          type="submit"
          disabled={isLoading || !logo || productImages.length === 0}
          className="w-full py-4 bg-gradient-to-r from-primary to-primary-hover text-white font-bold rounded-xl shadow-xl shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:translate-y-0 text-lg flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                <span>جاري التصميم الذكي...</span>
              </>
          ) : (
              <>
                <span>إنشاء البوستر</span>
                <span className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </span>
              </>
          )}
        </button>
      </div>
    </form>
  );
}
