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
  onPrewarmHint?: (hint: { campaignType: CampaignType; subType?: string }) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

const POST_TYPE_AR = ["منتج", "خصم", "كوليكشن"] as const;
const POST_TYPE_EN = ["Product", "Discount", "Collection"] as const;
const CTA_EN = ["Shop now", "Buy now", "Order via WhatsApp"] as const;

export function FashionForm({ onSubmit, onPrewarmHint, isLoading, defaultValues }: FashionFormProps) {
  const { locale, t } = useLocale();
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [format, setFormat] = useState<OutputFormat>("instagram-square");
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;
  const postTypeOptions = locale === "ar" ? POST_TYPE_AR : POST_TYPE_EN;
  const ctaOptions = locale === "ar" ? FASHION_CTA_OPTIONS : CTA_EN;

  const [errors, setErrors] = useState<Record<string, string>>({});

  const postTypeMap = locale === "ar"
    ? { "منتج": "product", "خصم": "discount", "كوليكشن": "collection" } as const
    : { Product: "product", Discount: "discount", Collection: "collection" } as const;

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

    const brandName = (fd.get("brandName") as string)?.trim();
    const itemName = (fd.get("itemName") as string)?.trim();
    const newPrice = (fd.get("newPrice") as string)?.trim();
    const oldPrice = (fd.get("oldPrice") as string)?.trim();
    const whatsapp = (fd.get("whatsapp") as string)?.trim();

    if (!brandName) newErrors.brandName = t("اسم البراند مطلوب", "Brand name is required");
    if (!itemName) newErrors.itemName = t("اسم القطعة مطلوب", "Item name is required");
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

    onSubmit({
      category: "fashion",
      campaignType,
      brandName: brandName!,
      logo: logo!,
      productImage: productImage!,
      postType: (postTypeMap[postTypeLabel as keyof typeof postTypeMap] as FashionFormData["postType"]) ?? "product",
      itemName: itemName!,
      description: (fd.get("description") as string) || undefined,
      newPrice: newPrice!,
      oldPrice: oldPrice!,
      availableSizes: (fd.get("availableSizes") as string) || undefined,
      availableColors: (fd.get("availableColors") as string) || undefined,
      offerNote: (fd.get("offerNote") as string) || undefined,
      offerDuration: (fd.get("offerDuration") as string) || undefined,
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
            <FormInput
                label={t("اسم المتجر/البراند", "Store/brand name")}
                name="brandName"
                placeholder={t("مثال: ستايل بوتيك", "Example: Style Boutique")}
                required
                icon={Store}
                defaultValue={defaultValues?.businessName}
                error={errors.brandName}
            />

            <FormSelect
                label={t("نوع البوست", "Post type")}
                name="postType"
                options={postTypeOptions}
                required
                icon={Tag}
                onChange={handlePostTypeChange}
            />

            <FormInput
                label={t("اسم القطعة", "Item name")}
                name="itemName"
                placeholder={t("مثال: فستان سهرة", "Example: Evening dress")}
                required
                icon={Shirt}
                error={errors.itemName}
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
                    error={errors.newPrice}
                />
                <FormInput
                    label={t("السعر القديم", "Old price")}
                    name="oldPrice"
                    placeholder={t("350 ر.س", "$350")}
                    required
                    icon={Tag}
                    error={errors.oldPrice}
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
                error={errors.whatsapp}
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
             <div>
               <ImageUpload label={t("لوجو البراند", "Brand logo")} value={logo} onChange={setLogoOverride} />
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
