"use client";

import { useState, useEffect } from "react";
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
import { PosterLanguageSelector, usePosterLanguage } from "../poster-language-selector";
import { FormInput, FormSelect } from "../ui/form-input";
import { useLocale } from "@/hooks/use-locale";

const SERVICE_TYPE_STORAGE_KEY = "postaty-service-type";

const SERVICE_TYPE_OPTIONS: {
  value: string;
  ar: string;
  en: string;
}[] = [
  { value: "maintenance", ar: "صيانة", en: "Maintenance" },
  { value: "cleaning", ar: "تنظيف", en: "Cleaning" },
  { value: "travel", ar: "سفر", en: "Travel" },
  { value: "business", ar: "رجال أعمال", en: "Business" },
  { value: "consulting", ar: "استشارات", en: "Consulting" },
  { value: "other", ar: "أخرى", en: "Other" },
];

const KNOWN_SERVICE_VALUES = SERVICE_TYPE_OPTIONS.filter(o => o.value !== "other").map(o => o.value);

function getInitialServiceType(): string {
  if (typeof window === "undefined") return "maintenance";
  return localStorage.getItem(SERVICE_TYPE_STORAGE_KEY) || "maintenance";
}

function useServiceType() {
  const [serviceType, setServiceType] = useState(getInitialServiceType);

  useEffect(() => {
    localStorage.setItem(SERVICE_TYPE_STORAGE_KEY, serviceType);
  }, [serviceType]);

  return [serviceType, setServiceType] as const;
}

interface ServicesFormProps {
  onSubmit: (data: ServicesFormData) => void;
  onPrewarmHint?: (hint: { campaignType: CampaignType; subType?: string }) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

const PRICE_TYPES_AR = ["سعر ثابت", "ابتداءً من"] as const;
const PRICE_TYPES_EN = ["Fixed price", "Starting from"] as const;
const CTA_EN = ["Book now", "Request visit", "WhatsApp consultation"] as const;

export function ServicesForm({ onSubmit, onPrewarmHint, isLoading, defaultValues }: ServicesFormProps) {
  const { locale, t } = useLocale();
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [serviceImage, setServiceImage] = useState<string | null>(null);
  const [format, setFormat] = useState<OutputFormat>("instagram-square");
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const [posterLanguage, setPosterLanguage] = usePosterLanguage();
  const [serviceType, setServiceType] = useServiceType();
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;

  const isKnownService = KNOWN_SERVICE_VALUES.includes(serviceType);
  const selectedServiceOption = isKnownService ? serviceType : "other";
  const customServiceValue = isKnownService ? "" : serviceType;

  const priceTypes = locale === "ar" ? PRICE_TYPES_AR : PRICE_TYPES_EN;
  const ctaOptions = locale === "ar" ? SERVICES_CTA_OPTIONS : CTA_EN;

  const [errors, setErrors] = useState<Record<string, string>>({});

  const priceTypeMap = locale === "ar"
    ? { "سعر ثابت": "fixed", "ابتداءً من": "starting-from" } as const
    : { "Fixed price": "fixed", "Starting from": "starting-from" } as const;

  const handleCampaignTypeChange = (nextCampaignType: CampaignType) => {
    setCampaignType(nextCampaignType);
    onPrewarmHint?.({ campaignType: nextCampaignType });
  };

  const handleServiceTypeChange = (next: string) => {
    if (next === "other") {
      setServiceType("");
    } else {
      setServiceType(next);
      onPrewarmHint?.({ campaignType, subType: next });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newErrors: Record<string, string> = {};

    const businessName = (fd.get("businessName") as string)?.trim();
    const serviceName = (fd.get("serviceName") as string)?.trim();
    const price = (fd.get("price") as string)?.trim();
    const whatsapp = (fd.get("whatsapp") as string)?.trim();
    const priceTypeLabel = fd.get("priceType") as string;
    const priceTypeValue = priceTypeMap[priceTypeLabel as keyof typeof priceTypeMap];

    if (!businessName) newErrors.businessName = t("اسم الشركة مطلوب", "Business name is required");
    if (!serviceType.trim()) newErrors.serviceType = t("نوع الخدمة مطلوب", "Service type is required");
    if (!serviceName) newErrors.serviceName = t("اسم الخدمة مطلوب", "Service name is required");
    if (!price) newErrors.price = t("السعر مطلوب", "Price is required");
    if (!priceTypeValue) newErrors.priceType = t("نوع السعر مطلوب", "Price type is required");
    if (!whatsapp) newErrors.whatsapp = t("رقم الواتساب مطلوب", "WhatsApp number is required");
    if (!logo) newErrors.logo = t("اللوجو مطلوب", "Logo is required");
    if (!serviceImage) newErrors.serviceImage = t("صورة الخدمة مطلوبة", "Service image is required");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    onSubmit({
      category: "services",
      campaignType,
      posterLanguage,
      businessName: businessName!,
      logo: logo!,
      serviceImage: serviceImage!,
      serviceType: serviceType.trim(),
      serviceName: serviceName!,
      serviceDetails: (fd.get("serviceDetails") as string) || undefined,
      price: price!,
      priceType: priceTypeValue as ServicesFormData["priceType"],
      executionTime: (fd.get("executionTime") as string) || undefined,
      coverageArea: (fd.get("coverageArea") as string) || undefined,
      warranty: (fd.get("warranty") as string) || undefined,
      quickFeatures: (fd.get("quickFeatures") as string) || undefined,
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

          <div className="bg-surface-2 p-4 rounded-2xl border border-card-border">
             <PosterLanguageSelector value={posterLanguage} onChange={setPosterLanguage} />
          </div>

          <div className="space-y-5">
            <FormInput label={t("اسم الشركة/مقدم الخدمة", "Business/provider name")} name="businessName" placeholder={t("مثال: شركة النجم للصيانة", "Example: Star Maintenance Co.")} required icon={Building2} defaultValue={defaultValues?.businessName} error={errors.businessName} />
            <div className="bg-surface-2 p-4 rounded-2xl border border-card-border space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-muted shrink-0" />
                <label className="text-sm font-medium text-foreground/80">
                  {t("نوع الخدمة", "Service type")}
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPE_OPTIONS.map((opt) => {
                  const isActive = selectedServiceOption === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleServiceTypeChange(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        isActive
                          ? "border-primary/60 bg-primary/10 text-primary"
                          : "border-card-border bg-surface-1 text-muted hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      {locale === "ar" ? opt.ar : opt.en}
                    </button>
                  );
                })}
              </div>
              {selectedServiceOption === "other" && (
                <input
                  type="text"
                  value={customServiceValue}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder={t("اكتب نوع الخدمة (مثال: تصميم)", "Type the service (e.g., Design)")}
                  className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-surface-1 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  autoFocus
                />
              )}
              {errors.serviceType && <p className="text-xs text-red-500 font-medium">{errors.serviceType}</p>}
            </div>
            <FormInput label={t("اسم الخدمة", "Service name")} name="serviceName" placeholder={t("مثال: صيانة تكييفات", "Example: AC maintenance")} required icon={Wrench} error={errors.serviceName} />
            <FormInput label={t("تفاصيل الخدمة (اختياري)", "Service details (optional)")} name="serviceDetails" placeholder={t("مثال: فحص شامل + تنظيف + تعبئة فريون", "Example: Inspection + Cleaning + Gas refill")} icon={FileText} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label={t("السعر", "Price")} name="price" placeholder={t("150 ر.س", "$150")} required icon={Tag} error={errors.price} />
                <FormSelect label={t("نوع السعر", "Price type")} name="priceType" options={priceTypes} required icon={Tag} error={errors.priceType} />
            </div>
            <FormInput label={t("مدة التنفيذ (اختياري)", "Execution time (optional)")} name="executionTime" placeholder={t("مثال: خلال 24 ساعة", "Example: Within 24 hours")} icon={Clock} />
            <FormInput label={t("منطقة الخدمة (اختياري)", "Coverage area (optional)")} name="coverageArea" placeholder={t("مثال: دبي وضواحيها", "Example: Dubai and nearby areas")} icon={MapPin} />
            <FormInput label={t("ضمان/اعتماد (اختياري)", "Warranty/Certification (optional)")} name="warranty" placeholder={t("مثال: ضمان 6 أشهر", "Example: 6-month warranty")} icon={Shield} />
            <FormInput label={t("مميزات سريعة - 3 كلمات (اختياري)", "Quick features - 3 words (optional)")} name="quickFeatures" placeholder={t("مثال: سرعة - جودة - ضمان", "Example: Speed - Quality - Warranty")} icon={Zap} />
            <FormInput label={t("مدة العرض (اختياري)", "Offer duration (optional)")} name="offerDuration" placeholder={t("مثال: لفترة محدودة", "Example: Limited time")} icon={Calendar} />
            <FormInput label={t("رقم الواتساب", "WhatsApp number")} name="whatsapp" type="tel" dir="ltr" placeholder="+971xxxxxxxxx" required icon={Phone} className="text-left" error={errors.whatsapp} />
            <FormSelect label={t("نص الزر (CTA)", "CTA text")} name="cta" options={ctaOptions} required icon={MousePointerClick} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-6">
             <div>
               <ImageUpload label={t("لوجو الشركة", "Company logo")} value={logo} onChange={setLogoOverride} />
               {errors.logo && <p className="text-xs text-red-500 font-medium mt-2">{errors.logo}</p>}
             </div>
             <div>
               <ImageUpload label={t("صورة الخدمة", "Service image")} value={serviceImage} onChange={setServiceImage} />
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
