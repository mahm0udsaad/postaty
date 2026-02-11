"use client";

import { useState } from "react";
import { Store, ShoppingBag, Tag, Percent, Truck, Phone, Type, MousePointerClick } from "lucide-react";
import type { OnlineFormData, OutputFormat, CampaignType } from "@/lib/types";
import { ONLINE_CTA_OPTIONS, ONLINE_HEADLINE_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { FormatSelector } from "../format-selector";
import { CampaignTypeSelector } from "../campaign-type-selector";
import { FormInput, FormSelect } from "../ui/form-input";

interface OnlineFormProps {
  onSubmit: (data: OnlineFormData) => void;
  isLoading: boolean;
}

export function OnlineForm({ onSubmit, isLoading }: OnlineFormProps) {
  const [logo, setLogo] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [formats, setFormats] = useState<OutputFormat[]>(["instagram-square"]);
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!logo || !productImage) return;

    onSubmit({
      category: "online",
      campaignType,
      shopName: fd.get("shopName") as string,
      logo,
      productImage,
      productName: fd.get("productName") as string,
      price: fd.get("price") as string,
      discount: (fd.get("discount") as string) || undefined,
      shipping: fd.get("shipping") as "free" | "paid",
      whatsapp: fd.get("whatsapp") as string,
      headline: fd.get("headline") as string,
      cta: fd.get("cta") as string,
      formats,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-slate-50/50 p-1 rounded-2xl border border-slate-100">
             <CampaignTypeSelector value={campaignType} onChange={setCampaignType} />
          </div>

          <div className="space-y-5">
            <FormInput
                label="اسم المتجر"
                name="shopName"
                placeholder="مثال: متجر نون"
                required
                icon={Store}
            />
            
            <FormInput
                label="اسم المنتج"
                name="productName"
                placeholder="مثال: سماعات أيربودز"
                required
                icon={ShoppingBag}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    label="السعر"
                    name="price"
                    placeholder="199 ر.س"
                    required
                    icon={Tag}
                />
                <FormInput
                    label="خصم (اختياري)"
                    name="discount"
                    placeholder="مثال: 30%"
                    icon={Percent}
                />
            </div>

            <div className="group space-y-2">
                <label className="text-sm font-semibold text-slate-700">نوع الشحن</label>
                <div className="relative">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                        <Truck size={18} />
                    </div>
                    <select
                        name="shipping"
                        required
                        className="w-full pr-11 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 font-medium transition-all duration-300 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 appearance-none cursor-pointer"
                    >
                        <option value="free">شحن مجاني</option>
                        <option value="paid">شحن مدفوع</option>
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>

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
                label="نص العرض الرئيسي"
                name="headline"
                options={ONLINE_HEADLINE_OPTIONS}
                required
                icon={Type}
            />

            <FormSelect
                label="نص الزر (CTA)"
                name="cta"
                options={ONLINE_CTA_OPTIONS}
                required
                icon={MousePointerClick}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <div className="space-y-6">
             <ImageUpload label="لوجو المتجر" value={logo} onChange={setLogo} />
             <ImageUpload label="صورة المنتج" value={productImage} onChange={setProductImage} />
          </div>
          
          <div className="pt-4 border-t border-slate-100">
             <FormatSelector selected={formats} onChange={setFormats} />
          </div>
        </div>
      </div>

      <div className="sticky bottom-24 z-30 bg-gradient-to-t from-white via-white/95 to-transparent pb-4 pt-8 -mx-6 px-6 md:static md:bg-none md:p-0 md:m-0 transition-all">
        <button
          type="submit"
          disabled={isLoading || !logo || !productImage}
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