"use client";

import type { TemplateFormValues } from "@/lib/template-bindings";
import { SUPERMARKET_HEADLINE_OPTIONS, SUPERMARKET_CTA_OPTIONS } from "@/lib/constants";
import { ImageUpload } from "../image-upload";

interface Props {
  values: TemplateFormValues;
  onChange: (partial: Partial<TemplateFormValues>) => void;
}

export function TemplateFormSupermarket({ values, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground/80">نص العرض</label>
        <div className="relative">
          <select
            value={values.headline}
            onChange={(e) => onChange({ headline: e.target.value })}
            className="w-full px-5 py-3.5 rounded-xl border border-card-border bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
          >
            <option value="">اختر...</option>
            {SUPERMARKET_HEADLINE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground/80">اسم المنتج</label>
        <input
          value={values.productName}
          onChange={(e) => onChange({ productName: e.target.value })}
          className="w-full px-5 py-3.5 rounded-xl border border-card-border bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
          placeholder="مثال: زيت زيتون"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground/80">السعر / الوزن</label>
        <input
          value={values.price}
          onChange={(e) => onChange({ price: e.target.value })}
          className="w-full px-5 py-3.5 rounded-xl border border-card-border bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted/50"
          placeholder="مثال: 15 ر.س / كيلو"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground/80">نص الزر (CTA)</label>
        <div className="relative">
          <select
            value={values.cta}
            onChange={(e) => onChange({ cta: e.target.value })}
            className="w-full px-5 py-3.5 rounded-xl border border-card-border bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
          >
            <option value="">اختر...</option>
            {SUPERMARKET_CTA_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>
      <ImageUpload label="لوجو المحل" value={values.logo} onChange={(v) => onChange({ logo: v })} />
      <ImageUpload label="صورة المنتج" value={values.productImage} onChange={(v) => onChange({ productImage: v })} />
    </div>
  );
}
