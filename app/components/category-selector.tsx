"use client";

import { UtensilsCrossed, ShoppingCart, Package, ArrowRight } from "lucide-react";
import type { Category } from "@/lib/types";

interface CategorySelectorProps {
  onSelect: (category: Category) => void;
}

const categories: {
  id: Category;
  label: string;
  icon: typeof UtensilsCrossed;
  description: string;
  gradient: string;
  shadow: string;
  color: string;
}[] = [
  {
    id: "restaurant",
    label: "مطاعم وكافيهات",
    icon: UtensilsCrossed,
    description: "صمم بوسترات لوجباتك وعروضك المميزة بلمسة شهية.",
    gradient: "from-orange-500 to-red-500",
    shadow: "shadow-orange-500/20",
    color: "text-orange-600",
  },
  {
    id: "supermarket",
    label: "سوبر ماركت",
    icon: ShoppingCart,
    description: "عروض المنتجات والخصومات الأسبوعية بتصاميم ملفتة.",
    gradient: "from-blue-500 to-cyan-500",
    shadow: "shadow-blue-500/20",
    color: "text-blue-600",
  },
  {
    id: "online",
    label: "منتجات أونلاين",
    icon: Package,
    description: "روج لمنتجات متجرك الإلكتروني وزد مبيعاتك.",
    gradient: "from-purple-500 to-indigo-500",
    shadow: "shadow-purple-500/20",
    color: "text-purple-600",
  },
];

export function CategorySelector({ onSelect }: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      {categories.map((cat) => {
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`group relative bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] p-8 text-right hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl ${cat.shadow} overflow-hidden`}
          >
            {/* Hover Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
            
            {/* Top Shine Effect */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col h-full">
              {/* Icon Container */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.gradient} p-0.5 mb-6 shadow-lg shadow-black/5 transform group-hover:scale-110 transition-transform duration-500`}>
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center border border-slate-100">
                  <Icon size={28} className={cat.color} />
                </div>
              </div>

              {/* Text Content */}
              <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-primary transition-colors">
                {cat.label}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow group-hover:text-slate-700 transition-colors">
                {cat.description}
              </p>

              {/* CTA Indicator */}
              <div className="flex items-center text-sm font-bold text-primary opacity-100 md:opacity-0 md:group-hover:opacity-100 transform translate-x-0 md:translate-x-4 md:group-hover:translate-x-0 transition-all duration-300">
                <span>ابدأ التصميم</span>
                <ArrowRight size={16} className="mr-2 animate-pulse" />
              </div>
            </div>

            {/* Decorative Circle */}
            <div className={`absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr ${cat.gradient} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
          </button>
        );
      })}
    </div>
  );
}
