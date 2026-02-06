"use client";

import { Square, Smartphone, Monitor, Image, MessageCircle } from "lucide-react";
import type { OutputFormat } from "@/lib/types";
import { FORMAT_CONFIGS, AI_GENERATION_FORMATS } from "@/lib/constants";

interface FormatSelectorProps {
  selected: OutputFormat[];
  onChange: (formats: OutputFormat[]) => void;
}

const formatIcons: Record<OutputFormat, typeof Square> = {
  "instagram-square": Square,
  "instagram-story": Smartphone,
  "facebook-post": Monitor,
  "facebook-cover": Image,
  "twitter-post": Monitor,
  "whatsapp-status": MessageCircle,
};

export function FormatSelector({ selected, onChange }: FormatSelectorProps) {
  const toggle = (format: OutputFormat) => {
    if (selected.includes(format)) {
      if (selected.length > 1) {
        onChange(selected.filter((f) => f !== format));
      }
    } else {
      onChange([...selected, format]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-3 text-foreground/80">
        اختر حجم المنشور
      </label>
      <div className="grid grid-cols-3 gap-4">
        {AI_GENERATION_FORMATS.map((format) => {
          const config = FORMAT_CONFIGS[format];
          const Icon = formatIcons[format];
          const isSelected = selected.includes(format);

          return (
            <button
              key={format}
              type="button"
              onClick={() => toggle(format)}
              className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-200
                ${isSelected 
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary ring-offset-2" 
                  : "border-card-border text-muted hover:border-primary/30 hover:bg-slate-50"}`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-slate-100'}`}>
                <Icon size={24} />
              </div>
              <div className="text-center">
                <span className="block text-xs font-bold mb-1">{config.label}</span>
                <span className="block text-[10px] opacity-70 bg-white/50 px-2 py-0.5 rounded-full border border-black/5">{config.aspectRatio}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
