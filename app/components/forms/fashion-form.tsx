"use client";

import { useState } from "react";
import {
  Store,
  Tag,
  Shirt,
  FileText,
  Ruler,
  Palette,
  Percent,
  Calendar,
  Phone,
  MousePointerClick,
} from "lucide-react";
import type { FashionFormData, OutputFormat, CampaignType } from "@/lib/types";
import { FASHION_CTA_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";
import { FormInput, FormSelect } from "../ui/form-input";

interface FashionFormProps {
  onSubmit: (data: FashionFormData) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

export function FashionForm({ onSubmit, isLoading, defaultValues }: FashionFormProps) {
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [formats, setFormats] = useState<OutputFormat[]>(["instagram-square"]);
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!logo || !productImage) return;

    onSubmit({
      category: "fashion",
      campaignType,
      brandName: fd.get("brandName") as string,
      logo,
      productImage,
      postType: fd.get("postType") as FashionFormData["postType"],
      itemName: fd.get("itemName") as string,
      description: (fd.get("description") as string) || undefined,
      newPrice: fd.get("newPrice") as string,
      oldPrice: fd.get("oldPrice") as string,
      availableSizes: (fd.get("availableSizes") as string) || undefined,
      availableColors: (fd.get("availableColors") as string) || undefined,
      offerNote: (fd.get("offerNote") as string) || undefined,
      offerDuration: (fd.get("offerDuration") as string) || undefined,
      whatsapp: fd.get("whatsapp") as string,
      cta: fd.get("cta") as string,
      formats,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          <div className="bg-surface-2 p-1 rounded-2xl border border-card-border">
             <CampaignTypeSelector value={campaignType} onChange={setCampaignType} />
          </div>

          <div className="space-y-5">
            <FormInput
                label="اسم المتجر/البراند"
                name="brandName"
                placeholder="مثال: ستايل بوتيك"
                required
                icon={Store}
                defaultValue={defaultValues?.businessName}
            />

            <FormSelect
                label="نوع البوست"
                name="postType"
                options={["منتج", "خصم", "كوليكشن"]}
                required
                icon={Tag}
            />

            <FormInput
                label="اسم القطعة"
                name="itemName"
                placeholder="مثال: فستان سهرة"
                required
                icon={Shirt}
            />

            <FormInput
                label="وصف سريع (اختياري)"
                name="description"
                placeholder="مثال: قماش ساتان فاخر"
                icon={FileText}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="السعر الجديد"
                    name="newPrice"
                    placeholder="199 ر.س"
                    required
                    icon={Tag}
                />
                <FormInput
                    label="السعر القديم"
                    name="oldPrice"
                    placeholder="350 ر.س"
                    required
                    icon={Tag}
                />
            </div>

            <FormInput
                label="المقاسات المتاحة (اختياري)"
                name="availableSizes"
                placeholder="مثال: S, M, L, XL"
                icon={Ruler}
            />

            <FormInput
                label="الألوان المتاحة (اختياري)"
                name="availableColors"
                placeholder="مثال: أسود، أبيض، أحمر"
                icon={Palette}
            />

            <FormInput
                label="ملاحظة عرض (اختياري)"
                name="offerNote"
                placeholder="مثال: خصم 30% على القطعة الثانية"
                icon={Percent}
            />

            <FormInput
                label="مدة العرض (اختياري)"
                name="offerDuration"
                placeholder="مثال: لفترة محدودة"
                icon={Calendar}
            />

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
                options={FASHION_CTA_OPTIONS}
                required
                icon={MousePointerClick}
            />
          </div>
        </div>

        {/* Right Column: Uploads */}
        <div className="space-y-8">
          <div className="space-y-6">
             <ImageUpload label="لوجو البراند" value={logo} onChange={setLogoOverride} />
             <ImageUpload label="صورة المنتج" value={productImage} onChange={setProductImage} />
          </div>

          <div className="pt-4 border-t border-card-border">
             <FormatSelector selected={formats} onChange={setFormats} />
          </div>
        </div>
      </div>

      {/* Sticky Submit Button */}
      <div className="sticky bottom-24 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pb-4 pt-8 -mx-6 px-6 md:static md:bg-none md:p-0 md:m-0 transition-all">
        <button
          type="submit"
          disabled={isLoading || !logo || !productImage}
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
