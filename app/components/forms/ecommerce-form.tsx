"use client";

import { useState } from "react";
import { Store, ShoppingBag, Tag, Truck, Phone, MousePointerClick, FileText, Palette, Package, Link } from "lucide-react";
import type { EcommerceFormData, OutputFormat, CampaignType } from "@/lib/types";
import { ECOMMERCE_CTA_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";
import { FormInput, FormSelect } from "../ui/form-input";

interface EcommerceFormProps {
  onSubmit: (data: EcommerceFormData) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

const POST_TYPE_OPTIONS = ["منتج", "تخفيضات", "وصل حديثاً"] as const;
const POST_TYPE_VALUES: Record<string, EcommerceFormData["postType"]> = {
  "منتج": "product",
  "تخفيضات": "sales",
  "وصل حديثاً": "new-arrival",
};

const AVAILABILITY_OPTIONS = ["متوفر", "غير متوفر", "طلب مسبق"] as const;
const AVAILABILITY_VALUES: Record<string, EcommerceFormData["availability"]> = {
  "متوفر": "in-stock",
  "غير متوفر": "out-of-stock",
  "طلب مسبق": "preorder",
};

export function EcommerceForm({ onSubmit, isLoading, defaultValues }: EcommerceFormProps) {
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [formats, setFormats] = useState<OutputFormat[]>(["instagram-square"]);
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!logo || !productImage) return;

    const postTypeLabel = fd.get("postType") as string;
    const availabilityLabel = fd.get("availability") as string;

    onSubmit({
      category: "ecommerce",
      campaignType,
      shopName: fd.get("shopName") as string,
      logo,
      productImage,
      postType: POST_TYPE_VALUES[postTypeLabel] ?? "product",
      productName: fd.get("productName") as string,
      features: (fd.get("features") as string) || undefined,
      newPrice: fd.get("newPrice") as string,
      oldPrice: fd.get("oldPrice") as string,
      colorSize: (fd.get("colorSize") as string) || undefined,
      availability: AVAILABILITY_VALUES[availabilityLabel] ?? "in-stock",
      shippingDuration: (fd.get("shippingDuration") as string) || undefined,
      purchaseLink: (fd.get("purchaseLink") as string) || undefined,
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
                label="اسم المتجر"
                name="shopName"
                placeholder="مثال: متجر نون"
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
                placeholder="مثال: سماعات أيربودز"
                required
                icon={ShoppingBag}
            />

            <FormInput
                label="المميزات (اختياري)"
                name="features"
                placeholder="مثال: بلوتوث 5.0 - عزل ضوضاء - شحن لاسلكي"
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
                label="اللون / المقاس (اختياري)"
                name="colorSize"
                placeholder="مثال: أبيض - أسود / مقاس M"
                icon={Palette}
            />

            <FormSelect
                label="التوفر"
                name="availability"
                options={AVAILABILITY_OPTIONS}
                required
                icon={Package}
            />

            <FormInput
                label="مدة الشحن (اختياري)"
                name="shippingDuration"
                placeholder="مثال: 2-3 أيام عمل"
                icon={Truck}
            />

            <FormInput
                label="رابط الشراء (اختياري)"
                name="purchaseLink"
                dir="ltr"
                placeholder="https://..."
                icon={Link}
                className="text-left"
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
                options={ECOMMERCE_CTA_OPTIONS}
                required
                icon={MousePointerClick}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <div className="space-y-6">
             <ImageUpload label="لوجو المتجر" value={logo} onChange={setLogoOverride} />
             <ImageUpload label="صورة المنتج" value={productImage} onChange={setProductImage} />
          </div>

          <div className="pt-4 border-t border-card-border">
             <FormatSelector selected={formats} onChange={setFormats} />
          </div>
        </div>
      </div>

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
