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

interface ServicesFormProps {
  onSubmit: (data: ServicesFormData) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

export function ServicesForm({ onSubmit, isLoading, defaultValues }: ServicesFormProps) {
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [serviceImage, setServiceImage] = useState<string | null>(null);
  const [formats, setFormats] = useState<OutputFormat[]>(["instagram-square"]);
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;

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
                label="اسم الشركة/مقدم الخدمة"
                name="businessName"
                placeholder="مثال: شركة النجم للصيانة"
                required
                icon={Building2}
                defaultValue={defaultValues?.businessName}
            />

            <FormSelect
                label="نوع الخدمة"
                name="serviceType"
                options={["صيانة", "تنظيف", "سفر", "رجال أعمال", "استشارات"]}
                required
                icon={Briefcase}
            />

            <FormInput
                label="اسم الخدمة"
                name="serviceName"
                placeholder="مثال: صيانة تكييفات"
                required
                icon={Wrench}
            />

            <FormInput
                label="تفاصيل الخدمة (اختياري)"
                name="serviceDetails"
                placeholder="مثال: فحص شامل + تنظيف + تعبئة فريون"
                icon={FileText}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="السعر"
                    name="price"
                    placeholder="150 ر.س"
                    required
                    icon={Tag}
                />
                <FormSelect
                    label="نوع السعر"
                    name="priceType"
                    options={["سعر ثابت", "ابتداءً من"]}
                    required
                    icon={Tag}
                />
            </div>

            <FormInput
                label="مدة التنفيذ (اختياري)"
                name="executionTime"
                placeholder="مثال: خلال 24 ساعة"
                icon={Clock}
            />

            <FormInput
                label="منطقة الخدمة (اختياري)"
                name="coverageArea"
                placeholder="مثال: الرياض وضواحيها"
                icon={MapPin}
            />

            <FormInput
                label="ضمان/اعتماد (اختياري)"
                name="warranty"
                placeholder="مثال: ضمان 6 أشهر"
                icon={Shield}
            />

            <FormInput
                label="مميزات سريعة - 3 كلمات (اختياري)"
                name="quickFeatures"
                placeholder="مثال: سرعة - جودة - ضمان"
                icon={Zap}
            />

            <FormInput
                label="مدة العرض (اختياري)"
                name="offerDuration"
                placeholder="مثال: لفترة محدودة"
                icon={Calendar}
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
                options={SERVICES_CTA_OPTIONS}
                required
                icon={MousePointerClick}
            />
          </div>
        </div>

        {/* Right Column: Uploads */}
        <div className="space-y-8">
          <div className="space-y-6">
             <ImageUpload label="لوجو الشركة" value={logo} onChange={setLogoOverride} />
             <ImageUpload label="صورة الخدمة" value={serviceImage} onChange={setServiceImage} />
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
          disabled={isLoading || !logo || !serviceImage}
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
