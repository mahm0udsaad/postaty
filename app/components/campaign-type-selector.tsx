"use client";

import type { CampaignType } from "@/lib/types";
import { CAMPAIGN_TYPE_OPTIONS } from "@/lib/constants";
import { Sparkles, MoonStar, Star } from "lucide-react";

const CAMPAIGN_ICONS: Record<CampaignType, typeof Sparkles> = {
  standard: Sparkles,
  ramadan: MoonStar,
  eid: Star,
};

interface CampaignTypeSelectorProps {
  value: CampaignType;
  onChange: (value: CampaignType) => void;
}

export function CampaignTypeSelector({ value, onChange }: CampaignTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground/80">نوع الحملة</label>
        <span className="text-[11px] text-muted">اختياري - يغير الطابع البصري</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {CAMPAIGN_TYPE_OPTIONS.map((opt) => {
          const Icon = CAMPAIGN_ICONS[opt.value];
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`group text-right rounded-xl border px-4 py-3 transition-all shadow-sm hover:shadow-md ${
                isActive
                  ? "border-primary/60 bg-primary/10"
                  : "border-card-border bg-white/60 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                  <div className="text-[11px] text-muted mt-1">{opt.description}</div>
                </div>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isActive ? "bg-primary text-white" : "bg-slate-100 text-muted"
                  }`}
                >
                  <Icon size={16} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
