"use client";

import { useState } from "react";
import {
  Store,
  Sparkles,
  Heart,
  Star,
  Tag,
  Clock,
  Users,
  CalendarCheck,
  Calendar,
  Phone,
  MousePointerClick,
} from "lucide-react";
import type { BeautyFormData, OutputFormat, CampaignType } from "@/lib/types";
import { BEAUTY_CTA_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";
import { FormInput, FormSelect } from "../ui/form-input";
import { useLocale } from "@/hooks/use-locale";

interface BeautyFormProps {
  onSubmit: (data: BeautyFormData) => void;
  onPrewarmHint?: (hint: { campaignType: CampaignType; subType?: string }) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

const POST_TYPE_AR = ["خدمة صالون", "جلسة سبا", "منتج تجميلي"] as const;
const POST_TYPE_EN = ["Salon Service", "Spa Session", "Beauty Product"] as const;
const BOOKING_CONDITION_AR = ["حجز مسبق", "متاح فوراً"] as const;
const BOOKING_CONDITION_EN = ["Advance Booking", "Available Now"] as const;
const CTA_EN = ["Book now", "Reserve via WhatsApp", "Claim offer"] as const;

export function BeautyForm({ onSubmit, onPrewarmHint, isLoading, defaultValues }: BeautyFormProps) {
  const { locale, t } = useLocale();
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [serviceImage, setServiceImage] = useState<string | null>(null);
  const [format, setFormat] = useState<OutputFormat>("instagram-square");
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;
  const postTypeOptions = locale === "ar" ? POST_TYPE_AR : POST_TYPE_EN;
  const bookingConditionOptions = locale === "ar" ? BOOKING_CONDITION_AR : BOOKING_CONDITION_EN;
  const ctaOptions = locale === "ar" ? BEAUTY_CTA_OPTIONS : CTA_EN;

  const [errors, setErrors] = useState<Record<string, string>>({});

  const postTypeMap = locale === "ar"
    ? { "خدمة صالون": "salon-service", "جلسة سبا": "spa-session", "منتج تجميلي": "beauty-product" } as const
    : { "Salon Service": "salon-service", "Spa Session": "spa-session", "Beauty Product": "beauty-product" } as const;

  const bookingConditionMap = locale === "ar"
    ? { "حجز مسبق": "advance", "متاح فوراً": "available-now" } as const
    : { "Advance Booking": "advance", "Available Now": "available-now" } as const;

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

    const salonName = (fd.get("salonName") as string)?.trim();
    const serviceName = (fd.get("serviceName") as string)?.trim();
    const newPrice = (fd.get("newPrice") as string)?.trim();
    const oldPrice = (fd.get("oldPrice") as string)?.trim();
    const whatsapp = (fd.get("whatsapp") as string)?.trim();

    if (!salonName) newErrors.salonName = t("اسم الصالون مطلوب", "Salon name is required");
    if (!serviceName) newErrors.serviceName = t("اسم الخدمة مطلوب", "Service name is required");
    if (!newPrice) newErrors.newPrice = t("السعر الجديد مطلوب", "New price is required");
    if (!oldPrice) newErrors.oldPrice = t("السعر القديم مطلوب", "Old price is required");
    if (!whatsapp) newErrors.whatsapp = t("رقم الواتساب مطلوب", "WhatsApp number is required");
    if (!logo) newErrors.logo = t("اللوجو مطلوب", "Logo is required");
    if (!serviceImage) newErrors.serviceImage = t("صورة الخدمة مطلوبة", "Service image is required");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const postTypeLabel = fd.get("postType") as string;
    const bookingConditionLabel = fd.get("bookingCondition") as string;

    onSubmit({
      category: "beauty",
      campaignType,
      salonName: salonName!,
      logo: logo!,
      serviceImage: serviceImage!,
      postType: (postTypeMap[postTypeLabel as keyof typeof postTypeMap] as BeautyFormData["postType"]) ?? "salon-service",
      serviceName: serviceName!,
      benefit: (fd.get("benefit") as string) || undefined,
      newPrice: newPrice!,
      oldPrice: oldPrice!,
      sessionDuration: (fd.get("sessionDuration") as string) || undefined,
      suitableFor: (fd.get("suitableFor") as string) || undefined,
      bookingCondition: (bookingConditionMap[bookingConditionLabel as keyof typeof bookingConditionMap] as BeautyFormData["bookingCondition"]) ?? "advance",
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
                label={t("اسم الصالون/السبا/المتجر", "Salon/Spa/Store name")}
                name="salonName"
                placeholder={t("مثال: صالون ليالي", "Example: Layali Salon")}
                required
                icon={Store}
                defaultValue={defaultValues?.businessName}
                error={errors.salonName}
            />

            <FormSelect
                label={t("نوع البوست", "Post type")}
                name="postType"
                options={postTypeOptions}
                required
                icon={Sparkles}
                onChange={handlePostTypeChange}
            />

            <FormInput
                label={t("اسم الخدمة/المنتج", "Service/product name")}
                name="serviceName"
                placeholder={t("مثال: بروتين شعر", "Example: Hair protein")}
                required
                icon={Heart}
                error={errors.serviceName}
            />

            <FormInput
                label={t("النتيجة/الفائدة (اختياري)", "Result/benefit (optional)")}
                name="benefit"
                placeholder={t("مثال: شعر ناعم ولامع لمدة 6 أشهر", "Example: Smooth shiny hair for 6 months")}
                icon={Star}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label={t("السعر الجديد", "New price")}
                    name="newPrice"
                    placeholder={t("299 ر.س", "$299")}
                    required
                    icon={Tag}
                    error={errors.newPrice}
                />
                <FormInput
                    label={t("السعر القديم", "Old price")}
                    name="oldPrice"
                    placeholder={t("500 ر.س", "$500")}
                    required
                    icon={Tag}
                    error={errors.oldPrice}
                />
            </div>

            <FormInput
                label={t("مدة الجلسة/حجم المنتج (اختياري)", "Session duration/product size (optional)")}
                name="sessionDuration"
                placeholder={t("مثال: 90 دقيقة", "Example: 90 minutes")}
                icon={Clock}
            />

            <FormInput
                label={t("مناسب لـ (اختياري)", "Suitable for (optional)")}
                name="suitableFor"
                placeholder={t("مثال: جميع أنواع البشرة", "Example: All skin types")}
                icon={Users}
            />

            <FormSelect
                label={t("شرط الحجز", "Booking condition")}
                name="bookingCondition"
                options={bookingConditionOptions}
                required
                icon={CalendarCheck}
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
               <ImageUpload label={t("لوجو الصالون", "Salon logo")} value={logo} onChange={setLogoOverride} />
               {errors.logo && <p className="text-xs text-red-500 font-medium mt-2">{errors.logo}</p>}
             </div>
             <div>
               <ImageUpload label={t("صورة الخدمة/المنتج", "Service/product image")} value={serviceImage} onChange={setServiceImage} />
               {errors.serviceImage && <p className="text-xs text-red-500 font-medium mt-2">{errors.serviceImage}</p>}
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
