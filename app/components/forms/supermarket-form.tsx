"use client";

import { useState } from "react";
import { Store, ShoppingBasket, Scale, Clock, Phone, MousePointerClick, Tag, Percent, FileText, CalendarDays, Package } from "lucide-react";
import type { SupermarketFormData, OutputFormat, CampaignType } from "@/lib/types";
import { SUPERMARKET_CTA_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { MultiImageUpload } from "../multi-image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";
import { PosterLanguageSelector, usePosterLanguage } from "../poster-language-selector";
import { FormInput, FormSelect } from "../ui/form-input";
import { useLocale } from "@/hooks/use-locale";

interface SupermarketFormProps {
  onSubmit: (data: SupermarketFormData) => void;
  onPrewarmHint?: (hint: { campaignType: CampaignType; subType?: string }) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

const POST_TYPE_AR = ["منتج", "عروض يومية", "تخفيضات قسم"] as const;
const POST_TYPE_EN = ["Product", "Daily Offers", "Section Sales"] as const;
const CTA_EN = ["Order now", "Add to cart on WhatsApp", "Offer valid today"] as const;

export function SupermarketForm({ onSubmit, onPrewarmHint, isLoading, defaultValues }: SupermarketFormProps) {
  const { locale, t } = useLocale();
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [format, setFormat] = useState<OutputFormat>("instagram-square");
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const [posterLanguage, setPosterLanguage] = usePosterLanguage();
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;

  const postTypeOptions = locale === "ar" ? POST_TYPE_AR : POST_TYPE_EN;
  const ctaOptions = locale === "ar" ? SUPERMARKET_CTA_OPTIONS : CTA_EN;

  const [errors, setErrors] = useState<Record<string, string>>({});

  const postTypeMap = locale === "ar"
    ? { "منتج": "product", "عروض يومية": "daily-offers", "تخفيضات قسم": "section-sales" } as const
    : { Product: "product", "Daily Offers": "daily-offers", "Section Sales": "section-sales" } as const;

  const handleCampaignTypeChange = (nextCampaignType: CampaignType) => {
    setCampaignType(nextCampaignType);
    onPrewarmHint?.({ campaignType: nextCampaignType });
  };

  const handlePostTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const label = e.target.value;
    const mapped = postTypeMap[label as keyof typeof postTypeMap];
    if (mapped) {
      onPrewarmHint?.({ campaignType, subType: mapped });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newErrors: Record<string, string> = {};

    const supermarketName = (fd.get("supermarketName") as string)?.trim();
    const productName = (fd.get("productName") as string)?.trim();
    const newPrice = (fd.get("newPrice") as string)?.trim();
    const oldPrice = (fd.get("oldPrice") as string)?.trim();
    const whatsapp = (fd.get("whatsapp") as string)?.trim();

    if (!supermarketName) newErrors.supermarketName = t("اسم السوبر ماركت مطلوب", "Supermarket name is required");
    if (!productName) newErrors.productName = t("اسم المنتج مطلوب", "Product name is required");
    if (!newPrice) newErrors.newPrice = t("السعر الجديد مطلوب", "New price is required");
    if (!oldPrice) newErrors.oldPrice = t("السعر القديم مطلوب", "Old price is required");
    if (!whatsapp) newErrors.whatsapp = t("رقم الواتساب مطلوب", "WhatsApp number is required");
    if (!logo) newErrors.logo = t("اللوجو مطلوب", "Logo is required");
    if (productImages.length === 0) newErrors.productImages = t("صورة المنتج مطلوبة", "At least one product image is required");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const postTypeLabel = fd.get("postType") as string;

    onSubmit({
      category: "supermarket",
      campaignType,
      posterLanguage,
      supermarketName: supermarketName!,
      logo: logo!,
      productImages,
      postType: (postTypeMap[postTypeLabel as keyof typeof postTypeMap] as SupermarketFormData["postType"]) ?? "product",
      productName: productName!,
      quantity: (fd.get("quantity") as string) || undefined,
      newPrice: newPrice!,
      oldPrice: oldPrice!,
      discountPercentage: (fd.get("discountPercentage") as string) || undefined,
      offerLimit: (fd.get("offerLimit") as string) || undefined,
      offerDuration: (fd.get("offerDuration") as string) || undefined,
      expiryDate: (fd.get("expiryDate") as string) || undefined,
      whatsapp: whatsapp!,
      cta: fd.get("cta") as string,
      format,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-6">
          <div className="bg-surface-2 p-1 rounded-2xl border border-card-border">
            <CampaignTypeSelector value={campaignType} onChange={handleCampaignTypeChange} />
          </div>

          <div className="bg-surface-2 p-4 rounded-2xl border border-card-border">
            <PosterLanguageSelector value={posterLanguage} onChange={setPosterLanguage} />
          </div>

          <div className="space-y-5">
            <FormInput label={t("اسم السوبر ماركت", "Supermarket name")} name="supermarketName" placeholder={t("مثال: كارفور", "Example: Carrefour")} required icon={Store} defaultValue={defaultValues?.businessName} error={errors.supermarketName} />
            <FormSelect label={t("نوع البوست", "Post type")} name="postType" options={postTypeOptions} required icon={FileText} onChange={handlePostTypeChange} />
            <FormInput label={t("اسم المنتج", "Product name")} name="productName" placeholder={t("مثال: شيبسي ليز", "Example: Chips")} required icon={ShoppingBasket} error={errors.productName} />
            <FormInput label={t("الكمية / الوزن (اختياري)", "Quantity / weight (optional)")} name="quantity" placeholder={t("مثال: 200 جرام أو 6 حبات", "Example: 200g or 6 pieces")} icon={Scale} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label={t("السعر الجديد", "New price")} name="newPrice" placeholder={t("15 ر.س", "$15")} required icon={Tag} error={errors.newPrice} />
                <FormInput label={t("السعر القديم", "Old price")} name="oldPrice" placeholder={t("25 ر.س", "$25")} required icon={Tag} error={errors.oldPrice} />
            </div>
            <FormInput label={t("نسبة الخصم (اختياري)", "Discount percentage (optional)")} name="discountPercentage" placeholder={t("مثال: 40", "Example: 40")} icon={Percent} />
            <FormInput label={t("حد العرض (اختياري)", "Offer limit (optional)")} name="offerLimit" placeholder={t("مثال: 3 قطع لكل عميل", "Example: 3 units per customer")} icon={Package} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label={t("مدة العرض (اختياري)", "Offer duration (optional)")} name="offerDuration" placeholder={t("مثال: حتى نفاذ الكمية", "Example: Until out of stock")} icon={Clock} />
                <FormInput label={t("تاريخ الانتهاء (اختياري)", "Expiry date (optional)")} name="expiryDate" placeholder={t("مثال: 2025/03/15", "Example: 2025/03/15")} icon={CalendarDays} />
            </div>
            <FormInput label={t("رقم الواتساب", "WhatsApp number")} name="whatsapp" type="tel" dir="ltr" placeholder="+971xxxxxxxxx" required icon={Phone} className="text-left" error={errors.whatsapp} />
            <FormSelect label={t("نص الزر (CTA)", "CTA text")} name="cta" options={ctaOptions} required icon={MousePointerClick} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-6">
             <div>
               <ImageUpload label={t("لوجو السوبر ماركت", "Supermarket logo")} value={logo} onChange={setLogoOverride} />
               {errors.logo && <p className="text-xs text-red-500 font-medium mt-2">{errors.logo}</p>}
             </div>
             <div>
               <MultiImageUpload label={t("صور المنتج (يمكن رفع أكثر من صورة)", "Product images (multiple allowed)")} values={productImages} onChange={setProductImages} />
               {errors.productImages && <p className="text-xs text-red-500 font-medium mt-2">{errors.productImages}</p>}
             </div>
          </div>

          <div className="pt-4 border-t border-card-border">
             <FormatSelector selected={format} onChange={setFormat} />
          </div>
        </div>
      </div>

      <div className="sticky bottom-24 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pb-4 pt-8 -mx-6 px-6 md:static md:bg-none md:p-0 md:m-0 transition-all">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-primary to-primary-hover text-white font-bold rounded-xl shadow-xl shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:translate-y-0 text-lg flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                <span>{t("جاري التصميم بواسطة postaty...", "Generating with postaty...")}</span>
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
