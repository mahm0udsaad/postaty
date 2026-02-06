"use client";

import { Sparkles, LayoutTemplate } from "lucide-react";

interface PathSelectorProps {
  onSelectAI: () => void;
  onSelectTemplates: () => void;
}

const paths = [
  {
    id: "ai" as const,
    label: "توليد بالذكاء الاصطناعي",
    description: "أدخل بياناتك واترك الذكاء الاصطناعي يصمم لك بوستر احترافي فريد",
    icon: Sparkles,
  },
  {
    id: "templates" as const,
    label: "قوالب جاهزة",
    description: "اختر قالب جاهز وعدّل عليه مباشرة — بدون انتظار",
    icon: LayoutTemplate,
  },
];

export function PathSelector({ onSelectAI, onSelectTemplates }: PathSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
      {paths.map((path) => {
        const Icon = path.icon;
        const handleClick = path.id === "ai" ? onSelectAI : onSelectTemplates;
        return (
          <button
            key={path.id}
            onClick={handleClick}
            className="group relative bg-white border border-card-border rounded-3xl p-8 text-center hover:border-primary/50 hover:shadow-glow transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-110">
                <Icon size={36} className="text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                {path.label}
              </h3>
              <p className="text-base text-muted leading-relaxed">{path.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
