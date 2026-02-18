"use client";

import { useState } from "react";
import { Store, Utensils, Tag, Clock, Phone, MousePointerClick, Truck, MapPin, FileText, Award } from "lucide-react";
import type { RestaurantFormData, OutputFormat, CampaignType } from "@/lib/types";
import { RESTAURANT_CTA_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";
import { FormInput, FormSelect } from "../ui/form-input";

interface RestaurantFormProps {
  onSubmit: (data: RestaurantFormData) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

const POST_TYPE_OPTIONS = ["قائمة طعام", "عرض وجبة", "توصيل"] as const;
const POST_TYPE_VALUES: Record<string, RestaurantFormData["postType"]> = {
  "قائمة طعام": "menu",
  "عرض وجبة": "meal-offer",
  "توصيل": "delivery",
};

const OFFER_BADGE_OPTIONS = ["خصم %", "جديد", "الأفضل مبيعاً"] as const;
const OFFER_BADGE_VALUES: Record<string, NonNullable<RestaurantFormData["offerBadge"]>> = {
  "خصم %": "discount",
  "جديد": "new",
  "الأفضل مبيعاً": "bestseller",
};

const DELIVERY_OPTIONS = ["مجاني", "مدفوع"] as const;
const DELIVERY_VALUES: Record<string, NonNullable<RestaurantFormData["deliveryType"]>> = {
  "مجاني": "free",
  "مدفوع": "paid",
};

export function RestaurantForm({ onSubmit, isLoading, defaultValues }: RestaurantFormProps) {
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [formats, setFormats] = useState<OutputFormat[]>(["instagram-square"]);
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!logo || !mealImage) return;

    const postTypeLabel = fd.get("postType") as string;
    const offerBadgeLabel = fd.get("offerBadge") as string;
    const deliveryLabel = fd.get("deliveryType") as string;

    onSubmit({
      category: "restaurant",
      campaignType,
      restaurantName: fd.get("restaurantName") as string,
      logo,
      mealImage,
      postType: POST_TYPE_VALUES[postTypeLabel] ?? "meal-offer",
      mealName: fd.get("mealName") as string,
      description: (fd.get("description") as string) || undefined,
      newPrice: fd.get("newPrice") as string,
      oldPrice: fd.get("oldPrice") as string,
      offerBadge: offerBadgeLabel ? OFFER_BADGE_VALUES[offerBadgeLabel] : undefined,
      deliveryType: deliveryLabel ? DELIVERY_VALUES[deliveryLabel] : undefined,
      deliveryTime: (fd.get("deliveryTime") as string) || undefined,
      coverageAreas: (fd.get("coverageAreas") as string) || undefined,
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
                label="اسم المطعم"
                name="restaurantName"
                placeholder="مثال: مطعم الشام"
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
                label="اسم الوجبة"
                name="mealName"
                placeholder="مثال: شاورما دجاج"
                required
                icon={Utensils}
            />

            <FormInput
                label="وصف سريع (اختياري)"
                name="description"
                placeholder="مثال: برجر + بطاطس + مشروب"
                icon={FileText}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="السعر الجديد"
                    name="newPrice"
                    placeholder="25 ر.س"
                    required
                    icon={Tag}
                />
                <FormInput
                    label="السعر القديم"
                    name="oldPrice"
                    placeholder="40 ر.س"
                    required
                    icon={Tag}
                />
            </div>

            <FormSelect
                label="شارة العرض (اختياري)"
                name="offerBadge"
                options={OFFER_BADGE_OPTIONS}
                icon={Award}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormSelect
                    label="التوصيل (اختياري)"
                    name="deliveryType"
                    options={DELIVERY_OPTIONS}
                    icon={Truck}
                />
                <FormInput
                    label="وقت التوصيل"
                    name="deliveryTime"
                    placeholder="30-45 دقيقة"
                    icon={Clock}
                />
            </div>

            <FormInput
                label="المناطق التي يغطيها (اختياري)"
                name="coverageAreas"
                placeholder="مثال: جدة - الرياض"
                icon={MapPin}
            />

            <FormInput
                label="مدة العرض (اختياري)"
                name="offerDuration"
                placeholder="مثال: لفترة محدودة"
                icon={Clock}
            />

            <FormInput
                label="رقم الواتساب"
                name="whatsapp"
                type="tel"
                dir="ltr"
                placeholder="+966xxxxxxxxx"
                required
                icon={Phone}
                className="text-left"
            />

            <FormSelect
                label="نص الزر (CTA)"
                name="cta"
                options={RESTAURANT_CTA_OPTIONS}
                required
                icon={MousePointerClick}
            />
          </div>
        </div>

        {/* Right Column: Uploads */}
        <div className="space-y-8">
          <div className="space-y-6">
             <ImageUpload label="لوجو المطعم" value={logo} onChange={setLogoOverride} />
             <ImageUpload label="صورة الوجبة" value={mealImage} onChange={setMealImage} />
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
          disabled={isLoading || !logo || !mealImage}
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
