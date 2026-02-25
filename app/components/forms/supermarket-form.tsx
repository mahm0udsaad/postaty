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
import { useLocale } from "@/hooks/use-locale";

interface SupermarketFormProps {
  onSubmit: (data: SupermarketFormData) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

const POST_TYPE_AR = ["منتج", "عروض يومية", "تخفيضات قسم"] as const;
const POST_TYPE_EN = ["Product", "Daily Offers", "Section Sales"] as const;
const CTA_EN = ["Order now", "Add to cart on WhatsApp", "Offer valid today"] as const;

export function SupermarketForm({ onSubmit, isLoading, defaultValues }: SupermarketFormProps) {
  const { locale, t } = useLocale();
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [format, setFormat] = useState<OutputFormat>("instagram-square");
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;

  const postTypeOptions = locale === "ar" ? POST_TYPE_AR : POST_TYPE_EN;
  const ctaOptions = locale === "ar" ? SUPERMARKET_CTA_OPTIONS : CTA_EN;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!logo || productImages.length === 0) return;

    const postTypeLabel = fd.get("postType") as string;
    const postTypeMap = locale === "ar"
      ? { "منتج": "product", "عروض يومية": "daily-offers", "تخفيضات قسم": "section-sales" }
      : { Product: "product", "Daily Offers": "daily-offers", "Section Sales": "section-sales" };

    onSubmit({
      category: "supermarket",
      campaignType,
      supermarketName: fd.get("supermarketName") as string,
      logo,
      productImages,
      postType: (postTypeMap[postTypeLabel as keyof typeof postTypeMap] as SupermarketFormData["postType"]) ?? "product",
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
            <FormInput label={t("اسم السوبر ماركت", "Supermarket name")} name="supermarketName" placeholder={t("مثال: كارفور", "Example: Carrefour")} required icon={Store} defaultValue={defaultValues?.businessName} />
            <FormSelect label={t("نوع البوست", "Post type")} name="postType" options={postTypeOptions} required icon={FileText} placeholder={t("اختر نوع البوست", "Select post type")} />
            <FormInput label={t("اسم المنتج", "Product name")} name="productName" placeholder={t("مثال: شيبسي ليز", "Example: Chips")} required icon={ShoppingBasket} />
            <FormInput label={t("الكمية / الوزن (اختياري)", "Quantity / weight (optional)")} name="quantity" placeholder={t("مثال: 200 جرام أو 6 حبات", "Example: 200g or 6 pieces")} icon={Scale} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label={t("السعر الجديد", "New price")} name="newPrice" placeholder={t("15 ر.س", "$15")} required icon={Tag} />
                <FormInput label={t("السعر القديم", "Old price")} name="oldPrice" placeholder={t("25 ر.س", "$25")} required icon={Tag} />
            </div>
            <FormInput label={t("نسبة الخصم (اختياري)", "Discount percentage (optional)")} name="discountPercentage" placeholder={t("مثال: 40", "Example: 40")} icon={Percent} />
            <FormInput label={t("حد العرض (اختياري)", "Offer limit (optional)")} name="offerLimit" placeholder={t("مثال: 3 قطع لكل عميل", "Example: 3 units per customer")} icon={Package} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label={t("مدة العرض (اختياري)", "Offer duration (optional)")} name="offerDuration" placeholder={t("مثال: حتى نفاذ الكمية", "Example: Until out of stock")} icon={Clock} />
                <FormInput label={t("تاريخ الانتهاء (اختياري)", "Expiry date (optional)")} name="expiryDate" placeholder={t("مثال: 2025/03/15", "Example: 2025/03/15")} icon={CalendarDays} />
            </div>
            <FormInput label={t("رقم الواتساب", "WhatsApp number")} name="whatsapp" type="tel" dir="ltr" placeholder="+971xxxxxxxxx" required icon={Phone} className="text-left" />
            <FormSelect label={t("نص الزر (CTA)", "CTA text")} name="cta" options={ctaOptions} required icon={MousePointerClick} placeholder={t("اختر نص الزر", "Select CTA")} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-6">
             <ImageUpload label={t("لوجو السوبر ماركت", "Supermarket logo")} value={logo} onChange={setLogoOverride} />
             <MultiImageUpload label={t("صور المنتج (يمكن رفع أكثر من صورة)", "Product images (multiple allowed)")} values={productImages} onChange={setProductImages} />
          </div>

          <div className="pt-4 border-t border-card-border">
             <FormatSelector selected={format} onChange={setFormat} />
          </div>
        </div>
      </div>

      <div className="sticky bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] z-30 bg-gradient-to-t from-background via-background/95 to-transparent pb-4 pt-8 -mx-6 px-6 md:static md:bg-none md:p-0 md:m-0 transition-all">
        <button
          type="submit"
          disabled={isLoading || !logo || productImages.length === 0}
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
