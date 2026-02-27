"use client";

import { useState } from "react";
import { Store, ShoppingBag, Tag, Truck, Phone, MousePointerClick, FileText, Palette, Package, Link } from "lucide-react";
import type { EcommerceFormData, OutputFormat, CampaignType } from "@/lib/types";
import { ECOMMERCE_CTA_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";
import { FormInput, FormSelect } from "../ui/form-input";
import { useLocale } from "@/hooks/use-locale";

interface EcommerceFormProps {
  onSubmit: (data: EcommerceFormData) => void;
  onPrewarmHint?: (hint: { campaignType: CampaignType; subType?: string }) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

const POST_TYPE_AR = ["منتج", "تخفيضات", "وصل حديثاً"] as const;
const POST_TYPE_EN = ["Product", "Sales", "New Arrival"] as const;
const AVAILABILITY_AR = ["متوفر", "غير متوفر", "طلب مسبق"] as const;
const AVAILABILITY_EN = ["In Stock", "Out of Stock", "Preorder"] as const;
const CTA_EN = ["Buy now", "Shop now", "View details"] as const;

export function EcommerceForm({ onSubmit, onPrewarmHint, isLoading, defaultValues }: EcommerceFormProps) {
  const { locale, t } = useLocale();
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [format, setFormat] = useState<OutputFormat>("instagram-square");
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;

  const postTypes = locale === "ar" ? POST_TYPE_AR : POST_TYPE_EN;
  const availabilityOptions = locale === "ar" ? AVAILABILITY_AR : AVAILABILITY_EN;
  const ctaOptions = locale === "ar" ? ECOMMERCE_CTA_OPTIONS : CTA_EN;

  const [errors, setErrors] = useState<Record<string, string>>({});

  const postTypeMap = locale === "ar"
    ? { "منتج": "product", "تخفيضات": "sales", "وصل حديثاً": "new-arrival" } as const
    : { Product: "product", Sales: "sales", "New Arrival": "new-arrival" } as const;

  const availabilityMap = locale === "ar"
    ? { "متوفر": "in-stock", "غير متوفر": "out-of-stock", "طلب مسبق": "preorder" } as const
    : { "In Stock": "in-stock", "Out of Stock": "out-of-stock", Preorder: "preorder" } as const;

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

    const shopName = (fd.get("shopName") as string)?.trim();
    const productName = (fd.get("productName") as string)?.trim();
    const newPrice = (fd.get("newPrice") as string)?.trim();
    const oldPrice = (fd.get("oldPrice") as string)?.trim();
    const whatsapp = (fd.get("whatsapp") as string)?.trim();

    if (!shopName) newErrors.shopName = t("اسم المتجر مطلوب", "Store name is required");
    if (!productName) newErrors.productName = t("اسم المنتج مطلوب", "Product name is required");
    if (!newPrice) newErrors.newPrice = t("السعر الجديد مطلوب", "New price is required");
    if (!oldPrice) newErrors.oldPrice = t("السعر القديم مطلوب", "Old price is required");
    if (!whatsapp) newErrors.whatsapp = t("رقم الواتساب مطلوب", "WhatsApp number is required");
    if (!logo) newErrors.logo = t("اللوجو مطلوب", "Logo is required");
    if (!productImage) newErrors.productImage = t("صورة المنتج مطلوبة", "Product image is required");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const postTypeLabel = fd.get("postType") as string;
    const availabilityLabel = fd.get("availability") as string;

    onSubmit({
      category: "ecommerce",
      campaignType,
      shopName: shopName!,
      logo: logo!,
      productImage: productImage!,
      postType: (postTypeMap[postTypeLabel as keyof typeof postTypeMap] as EcommerceFormData["postType"]) ?? "product",
      productName: productName!,
      features: (fd.get("features") as string) || undefined,
      newPrice: newPrice!,
      oldPrice: oldPrice!,
      colorSize: (fd.get("colorSize") as string) || undefined,
      availability: (availabilityMap[availabilityLabel as keyof typeof availabilityMap] as EcommerceFormData["availability"]) ?? "in-stock",
      shippingDuration: (fd.get("shippingDuration") as string) || undefined,
      purchaseLink: (fd.get("purchaseLink") as string) || undefined,
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

          <div className="space-y-5">
            <FormInput label={t("اسم المتجر", "Store name")} name="shopName" placeholder={t("مثال: متجر نون", "Example: Noon Store")} required icon={Store} defaultValue={defaultValues?.businessName} error={errors.shopName} />
            <FormSelect label={t("نوع البوست", "Post type")} name="postType" options={postTypes} required icon={FileText} onChange={handlePostTypeChange} />
            <FormInput label={t("اسم المنتج", "Product name")} name="productName" placeholder={t("مثال: سماعات أيربودز", "Example: AirPods")} required icon={ShoppingBag} error={errors.productName} />
            <FormInput label={t("المميزات (اختياري)", "Features (optional)")} name="features" placeholder={t("مثال: بلوتوث 5.0 - عزل ضوضاء - شحن لاسلكي", "Example: Bluetooth 5.0 - Noise cancelling - Wireless charging")} icon={FileText} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label={t("السعر الجديد", "New price")} name="newPrice" placeholder={t("199 ر.س", "$199")} required icon={Tag} error={errors.newPrice} />
                <FormInput label={t("السعر القديم", "Old price")} name="oldPrice" placeholder={t("350 ر.س", "$350")} required icon={Tag} error={errors.oldPrice} />
            </div>
            <FormInput label={t("اللون / المقاس (اختياري)", "Color / size (optional)")} name="colorSize" placeholder={t("مثال: أبيض - أسود / مقاس M", "Example: White - Black / Size M")} icon={Palette} />
            <FormSelect label={t("التوفر", "Availability")} name="availability" options={availabilityOptions} required icon={Package} />
            <FormInput label={t("مدة الشحن (اختياري)", "Shipping duration (optional)")} name="shippingDuration" placeholder={t("مثال: 2-3 أيام عمل", "Example: 2-3 business days")} icon={Truck} />
            <FormInput label={t("رابط الشراء (اختياري)", "Purchase link (optional)")} name="purchaseLink" dir="ltr" placeholder="https://..." icon={Link} className="text-left" />
            <FormInput label={t("رقم الواتساب", "WhatsApp number")} name="whatsapp" type="tel" dir="ltr" placeholder="+971xxxxxxxxx" required icon={Phone} className="text-left" error={errors.whatsapp} />
            <FormSelect label={t("نص الزر (CTA)", "CTA text")} name="cta" options={ctaOptions} required icon={MousePointerClick} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-6">
             <div>
               <ImageUpload label={t("لوجو المتجر", "Store logo")} value={logo} onChange={setLogoOverride} />
               {errors.logo && <p className="text-xs text-red-500 font-medium mt-2">{errors.logo}</p>}
             </div>
             <div>
               <ImageUpload label={t("صورة المنتج", "Product image")} value={productImage} onChange={setProductImage} />
               {errors.productImage && <p className="text-xs text-red-500 font-medium mt-2">{errors.productImage}</p>}
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
