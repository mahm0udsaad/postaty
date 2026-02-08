"use client";

import { FORMAT_CONFIGS } from "@/lib/constants";
import type { OutputFormat } from "@/lib/types";

interface FormatSwitcherProps {
  supportedFormats: OutputFormat[];
  selected: OutputFormat;
  onSelect: (format: OutputFormat) => void;
}

export function FormatSwitcher({ supportedFormats, selected, onSelect }: FormatSwitcherProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {supportedFormats.map((format) => {
        const config = FORMAT_CONFIGS[format];
        const isActive = format === selected;
        return (
          <button
            key={format}
            onClick={() => onSelect(format)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white border border-card-border text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-slate-50"
            }`}
          >
            {config.label} ({config.aspectRatio})
          </button>
        );
      })}
    </div>
  );
}
