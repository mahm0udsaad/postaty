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
import { useLocale } from "@/hooks/use-locale";

interface FashionFormProps {
  onSubmit: (data: FashionFormData) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

const POST_TYPE_AR = ["منتج", "خصم", "كوليكشن"] as const;
const POST_TYPE_EN = ["Product", "Discount", "Collection"] as const;
const CTA_EN = ["Shop now", "Buy now", "Order via WhatsApp"] as const;

export function FashionForm({ onSubmit, isLoading, defaultValues }: FashionFormProps) {
  const { locale, t } = useLocale();
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [format, setFormat] = useState<OutputFormat>("instagram-square");
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;
  const postTypeOptions = locale === "ar" ? POST_TYPE_AR : POST_TYPE_EN;
  const ctaOptions = locale === "ar" ? FASHION_CTA_OPTIONS : CTA_EN;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!logo || !productImage) return;

    const postTypeLabel = fd.get("postType") as string;
    const postTypeMap = locale === "ar"
      ? { "منتج": "product", "خصم": "discount", "كوليكشن": "collection" }
      : { Product: "product", Discount: "discount", Collection: "collection" };

    onSubmit({
      category: "fashion",
      campaignType,
      brandName: fd.get("brandName") as string,
      logo,
      productImage,
      postType: (postTypeMap[postTypeLabel as keyof typeof postTypeMap] as FashionFormData["postType"]) ?? "product",
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
      format,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-6">
          <div className="bg-surface-2 p-1 rounded-2xl border border-card-border">
             <CampaignTypeSelector value={campaignType} onChange={setCampaignType} />
          </div>

          <div className="space-y-5">
            <FormInput
                label={t("اسم المتجر/البراند", "Store/brand name")}
                name="brandName"
                placeholder={t("مثال: ستايل بوتيك", "Example: Style Boutique")}
                required
                icon={Store}
                defaultValue={defaultValues?.businessName}
            />

            <FormSelect
                label={t("نوع البوست", "Post type")}
                name="postType"
                options={postTypeOptions}
                required
                icon={Tag}
            />

            <FormInput
                label={t("اسم القطعة", "Item name")}
                name="itemName"
                placeholder={t("مثال: فستان سهرة", "Example: Evening dress")}
                required
                icon={Shirt}
            />

            <FormInput
                label={t("وصف سريع (اختياري)", "Quick description (optional)")}
                name="description"
                placeholder={t("مثال: قماش ساتان فاخر", "Example: Premium satin fabric")}
                icon={FileText}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label={t("السعر الجديد", "New price")}
                    name="newPrice"
                    placeholder={t("199 ر.س", "$199")}
                    required
                    icon={Tag}
                />
                <FormInput
                    label={t("السعر القديم", "Old price")}
                    name="oldPrice"
                    placeholder={t("350 ر.س", "$350")}
                    required
                    icon={Tag}
                />
            </div>

            <FormInput
                label={t("المقاسات المتاحة (اختياري)", "Available sizes (optional)")}
                name="availableSizes"
                placeholder={t("مثال: S, M, L, XL", "Example: S, M, L, XL")}
                icon={Ruler}
            />

            <FormInput
                label={t("الألوان المتاحة (اختياري)", "Available colors (optional)")}
                name="availableColors"
                placeholder={t("مثال: أسود، أبيض، أحمر", "Example: Black, White, Red")}
                icon={Palette}
            />

            <FormInput
                label={t("ملاحظة عرض (اختياري)", "Offer note (optional)")}
                name="offerNote"
                placeholder={t("مثال: خصم 30% على القطعة الثانية", "Example: 30% off second item")}
                icon={Percent}
            />

            <FormInput
                label={t("مدة العرض (اختياري)", "Offer duration (optional)")}
                name="offerDuration"
                placeholder={t("مثال: لفترة محدودة", "Example: Limited time")}
                icon={Calendar}
            />

            <FormInput
                label={t("رقم الواتساب", "WhatsApp number")}
                name="whatsapp"
                type="tel"
                dir="ltr"
                placeholder="+971xxxxxxxxx"
                required
                icon={Phone}
                className="text-left"
            />

            <FormSelect
                label={t("نص الزر (CTA)", "CTA text")}
                name="cta"
                options={ctaOptions}
                required
                icon={MousePointerClick}
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-6">
             <ImageUpload label={t("لوجو البراند", "Brand logo")} value={logo} onChange={setLogoOverride} />
             <ImageUpload label={t("صورة المنتج", "Product image")} value={productImage} onChange={setProductImage} />
          </div>

          <div className="pt-4 border-t border-card-border">
             <FormatSelector selected={format} onChange={setFormat} />
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
                <span>{t("جاري التصميم الذكي...", "Generating with AI...")}</span>
              </>
          ) : (
              <>
                <span>{t("إنشاء البوستر", "Generate poster")}</span>
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
