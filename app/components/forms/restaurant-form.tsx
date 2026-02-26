"use client";

import { useState } from "react";
import { Store, Utensils, Tag, Clock, Phone, MousePointerClick, Truck, MapPin, FileText, Award } from "lucide-react";
import type { RestaurantFormData, OutputFormat, CampaignType } from "@/lib/types";
import { RESTAURANT_CTA_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";
import { FormInput, FormSelect } from "../ui/form-input";
import { useLocale } from "@/hooks/use-locale";

interface RestaurantFormProps {
  onSubmit: (data: RestaurantFormData) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

const POST_TYPE_AR = ["قائمة طعام", "عرض وجبة", "توصيل"] as const;
const POST_TYPE_EN = ["Menu", "Meal Offer", "Delivery"] as const;

const OFFER_BADGE_AR = ["خصم %", "جديد", "الأفضل مبيعاً"] as const;
const OFFER_BADGE_EN = ["Discount %", "New", "Best Seller"] as const;

const DELIVERY_AR = ["مجاني", "مدفوع"] as const;
const DELIVERY_EN = ["Free", "Paid"] as const;

const CTA_EN = ["Order now and save", "Order before offer ends", "Fast delivery"] as const;

export function RestaurantForm({ onSubmit, isLoading, defaultValues }: RestaurantFormProps) {
  const { locale, t } = useLocale();
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [format, setFormat] = useState<OutputFormat>("instagram-square");
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;

  const postTypes = locale === "ar" ? POST_TYPE_AR : POST_TYPE_EN;
  const badges = locale === "ar" ? OFFER_BADGE_AR : OFFER_BADGE_EN;
  const deliveries = locale === "ar" ? DELIVERY_AR : DELIVERY_EN;
  const ctaOptions = locale === "ar" ? RESTAURANT_CTA_OPTIONS : CTA_EN;

  const [errors, setErrors] = useState<Record<string, string>>({});

  const postTypeValueMap = locale === "ar"
    ? { "قائمة طعام": "menu", "عرض وجبة": "meal-offer", "توصيل": "delivery" } as const
    : { Menu: "menu", "Meal Offer": "meal-offer", Delivery: "delivery" } as const;

  const offerBadgeValueMap = locale === "ar"
    ? { "خصم %": "discount", "جديد": "new", "الأفضل مبيعاً": "bestseller" } as const
    : { "Discount %": "discount", New: "new", "Best Seller": "bestseller" } as const;

  const deliveryValueMap = locale === "ar"
    ? { "مجاني": "free", "مدفوع": "paid" } as const
    : { Free: "free", Paid: "paid" } as const;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newErrors: Record<string, string> = {};

    const restaurantName = (fd.get("restaurantName") as string)?.trim();
    const mealName = (fd.get("mealName") as string)?.trim();
    const newPrice = (fd.get("newPrice") as string)?.trim();
    const oldPrice = (fd.get("oldPrice") as string)?.trim();
    const whatsapp = (fd.get("whatsapp") as string)?.trim();

    if (!restaurantName) newErrors.restaurantName = t("اسم المطعم مطلوب", "Restaurant name is required");
    if (!mealName) newErrors.mealName = t("اسم الوجبة مطلوب", "Meal name is required");
    if (!newPrice) newErrors.newPrice = t("السعر الجديد مطلوب", "New price is required");
    if (!oldPrice) newErrors.oldPrice = t("السعر القديم مطلوب", "Old price is required");
    if (!whatsapp) newErrors.whatsapp = t("رقم الواتساب مطلوب", "WhatsApp number is required");
    if (!logo) newErrors.logo = t("اللوجو مطلوب", "Logo is required");
    if (!mealImage) newErrors.mealImage = t("صورة الوجبة مطلوبة", "Meal image is required");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const postTypeLabel = fd.get("postType") as string;
    const offerBadgeLabel = fd.get("offerBadge") as string;
    const deliveryLabel = fd.get("deliveryType") as string;

    onSubmit({
      category: "restaurant",
      campaignType,
      restaurantName: restaurantName!,
      logo: logo!,
      mealImage: mealImage!,
      postType: (postTypeValueMap[postTypeLabel as keyof typeof postTypeValueMap] as RestaurantFormData["postType"]) ?? "meal-offer",
      mealName: mealName!,
      description: (fd.get("description") as string) || undefined,
      newPrice: newPrice!,
      oldPrice: oldPrice!,
      offerBadge: offerBadgeLabel ? (offerBadgeValueMap[offerBadgeLabel as keyof typeof offerBadgeValueMap] as NonNullable<RestaurantFormData["offerBadge"]>) : undefined,
      deliveryType: deliveryLabel ? (deliveryValueMap[deliveryLabel as keyof typeof deliveryValueMap] as NonNullable<RestaurantFormData["deliveryType"]>) : undefined,
      deliveryTime: (fd.get("deliveryTime") as string) || undefined,
      coverageAreas: (fd.get("coverageAreas") as string) || undefined,
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
             <CampaignTypeSelector value={campaignType} onChange={setCampaignType} />
          </div>

          <div className="space-y-5">
            <FormInput label={t("اسم المطعم", "Restaurant name")} name="restaurantName" placeholder={t("مثال: مطعم الشام", "Example: Al Sham Restaurant")} required icon={Store} defaultValue={defaultValues?.businessName} error={errors.restaurantName} />
            <FormSelect label={t("نوع البوست", "Post type")} name="postType" options={postTypes} required icon={FileText} />
            <FormInput label={t("اسم الوجبة", "Meal name")} name="mealName" placeholder={t("مثال: شاورما دجاج", "Example: Chicken Shawarma")} required icon={Utensils} error={errors.mealName} />
            <FormInput label={t("وصف سريع (اختياري)", "Quick description (optional)")} name="description" placeholder={t("مثال: برجر + بطاطس + مشروب", "Example: Burger + Fries + Drink")} icon={FileText} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label={t("السعر الجديد", "New price")} name="newPrice" placeholder={t("25 ر.س", "$25")} required icon={Tag} error={errors.newPrice} />
                <FormInput label={t("السعر القديم", "Old price")} name="oldPrice" placeholder={t("40 ر.س", "$40")} required icon={Tag} error={errors.oldPrice} />
            </div>
            <FormSelect label={t("شارة العرض (اختياري)", "Offer badge (optional)")} name="offerBadge" options={badges} icon={Award} />
            <div className="grid grid-cols-2 gap-4">
                <FormSelect label={t("التوصيل (اختياري)", "Delivery (optional)")} name="deliveryType" options={deliveries} icon={Truck} />
                <FormInput label={t("وقت التوصيل", "Delivery time")} name="deliveryTime" placeholder={t("30-45 دقيقة", "30-45 minutes")} icon={Clock} />
            </div>
            <FormInput label={t("المناطق التي يغطيها (اختياري)", "Coverage areas (optional)")} name="coverageAreas" placeholder={t("مثال: دبي - أبوظبي", "Example: Dubai - Abu Dhabi")} icon={MapPin} />
            <FormInput label={t("مدة العرض (اختياري)", "Offer duration (optional)")} name="offerDuration" placeholder={t("مثال: لفترة محدودة", "Example: Limited time")} icon={Clock} />
            <FormInput label={t("رقم الواتساب", "WhatsApp number")} name="whatsapp" type="tel" dir="ltr" placeholder="+971xxxxxxxxx" required icon={Phone} className="text-left" error={errors.whatsapp} />
            <FormSelect label={t("نص الزر (CTA)", "CTA text")} name="cta" options={ctaOptions} required icon={MousePointerClick} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-6">
             <div>
               <ImageUpload label={t("لوجو المطعم", "Restaurant logo")} value={logo} onChange={setLogoOverride} />
               {errors.logo && <p className="text-xs text-red-500 font-medium mt-2">{errors.logo}</p>}
             </div>
             <div>
               <ImageUpload label={t("صورة الوجبة", "Meal image")} value={mealImage} onChange={setMealImage} />
               {errors.mealImage && <p className="text-xs text-red-500 font-medium mt-2">{errors.mealImage}</p>}
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
