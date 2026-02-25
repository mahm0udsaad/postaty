"use client";

import { useState } from "react";
import {
  Building2,
  Briefcase,
  Wrench,
  FileText,
  Tag,
  Clock,
  MapPin,
  Shield,
  Zap,
  Calendar,
  Phone,
  MousePointerClick,
} from "lucide-react";
import type { ServicesFormData, OutputFormat, CampaignType } from "@/lib/types";
import { SERVICES_CTA_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";
import { FormInput, FormSelect } from "../ui/form-input";
import { useLocale } from "@/hooks/use-locale";

interface ServicesFormProps {
  onSubmit: (data: ServicesFormData) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

const SERVICE_TYPES_AR = ["صيانة", "تنظيف", "سفر", "رجال أعمال", "استشارات"] as const;
const SERVICE_TYPES_EN = ["Maintenance", "Cleaning", "Travel", "Business", "Consulting"] as const;
const PRICE_TYPES_AR = ["سعر ثابت", "ابتداءً من"] as const;
const PRICE_TYPES_EN = ["Fixed price", "Starting from"] as const;
const CTA_EN = ["Book now", "Request visit", "WhatsApp consultation"] as const;

export function ServicesForm({ onSubmit, isLoading, defaultValues }: ServicesFormProps) {
  const { locale, t } = useLocale();
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [serviceImage, setServiceImage] = useState<string | null>(null);
  const [format, setFormat] = useState<OutputFormat>("instagram-square");
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;

  const serviceTypes = locale === "ar" ? SERVICE_TYPES_AR : SERVICE_TYPES_EN;
  const priceTypes = locale === "ar" ? PRICE_TYPES_AR : PRICE_TYPES_EN;
  const ctaOptions = locale === "ar" ? SERVICES_CTA_OPTIONS : CTA_EN;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!logo || !serviceImage) return;

    onSubmit({
      category: "services",
      campaignType,
      businessName: fd.get("businessName") as string,
      logo,
      serviceImage,
      serviceType: fd.get("serviceType") as ServicesFormData["serviceType"],
      serviceName: fd.get("serviceName") as string,
      serviceDetails: (fd.get("serviceDetails") as string) || undefined,
      price: fd.get("price") as string,
      priceType: fd.get("priceType") as ServicesFormData["priceType"],
      executionTime: (fd.get("executionTime") as string) || undefined,
      coverageArea: (fd.get("coverageArea") as string) || undefined,
      warranty: (fd.get("warranty") as string) || undefined,
      quickFeatures: (fd.get("quickFeatures") as string) || undefined,
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
            <FormInput label={t("اسم الشركة/مقدم الخدمة", "Business/provider name")} name="businessName" placeholder={t("مثال: شركة النجم للصيانة", "Example: Star Maintenance Co.")} required icon={Building2} defaultValue={defaultValues?.businessName} />
            <FormSelect label={t("نوع الخدمة", "Service type")} name="serviceType" options={serviceTypes} required icon={Briefcase} placeholder={t("اختر نوع الخدمة", "Select service type")} />
            <FormInput label={t("اسم الخدمة", "Service name")} name="serviceName" placeholder={t("مثال: صيانة تكييفات", "Example: AC maintenance")} required icon={Wrench} />
            <FormInput label={t("تفاصيل الخدمة (اختياري)", "Service details (optional)")} name="serviceDetails" placeholder={t("مثال: فحص شامل + تنظيف + تعبئة فريون", "Example: Inspection + Cleaning + Gas refill")} icon={FileText} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label={t("السعر", "Price")} name="price" placeholder={t("150 ر.س", "$150")} required icon={Tag} />
                <FormSelect label={t("نوع السعر", "Price type")} name="priceType" options={priceTypes} required icon={Tag} placeholder={t("اختر نوع السعر", "Select price type")} />
            </div>
            <FormInput label={t("مدة التنفيذ (اختياري)", "Execution time (optional)")} name="executionTime" placeholder={t("مثال: خلال 24 ساعة", "Example: Within 24 hours")} icon={Clock} />
            <FormInput label={t("منطقة الخدمة (اختياري)", "Coverage area (optional)")} name="coverageArea" placeholder={t("مثال: دبي وضواحيها", "Example: Dubai and nearby areas")} icon={MapPin} />
            <FormInput label={t("ضمان/اعتماد (اختياري)", "Warranty/Certification (optional)")} name="warranty" placeholder={t("مثال: ضمان 6 أشهر", "Example: 6-month warranty")} icon={Shield} />
            <FormInput label={t("مميزات سريعة - 3 كلمات (اختياري)", "Quick features - 3 words (optional)")} name="quickFeatures" placeholder={t("مثال: سرعة - جودة - ضمان", "Example: Speed - Quality - Warranty")} icon={Zap} />
            <FormInput label={t("مدة العرض (اختياري)", "Offer duration (optional)")} name="offerDuration" placeholder={t("مثال: لفترة محدودة", "Example: Limited time")} icon={Calendar} />
            <FormInput label={t("رقم الواتساب", "WhatsApp number")} name="whatsapp" type="tel" dir="ltr" placeholder="+971xxxxxxxxx" required icon={Phone} className="text-left" />
            <FormSelect label={t("نص الزر (CTA)", "CTA text")} name="cta" options={ctaOptions} required icon={MousePointerClick} placeholder={t("اختر نص الزر", "Select CTA")} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-6">
             <ImageUpload label={t("لوجو الشركة", "Company logo")} value={logo} onChange={setLogoOverride} />
             <ImageUpload label={t("صورة الخدمة", "Service image")} value={serviceImage} onChange={setServiceImage} />
          </div>

          <div className="pt-4 border-t border-card-border">
             <FormatSelector selected={format} onChange={setFormat} />
          </div>
        </div>
      </div>

      <div className="sticky bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] z-30 bg-gradient-to-t from-background via-background/95 to-transparent pb-4 pt-8 -mx-6 px-6 md:static md:bg-none md:p-0 md:m-0 transition-all">
        <button
          type="submit"
          disabled={isLoading || !logo || !serviceImage}
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
