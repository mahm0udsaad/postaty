"use client";

import { UtensilsCrossed, ShoppingCart, Store, Wrench, Shirt, Sparkles, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { STAGGER_ITEM, TAP_SCALE } from "@/lib/animation";
import type { Category } from "@/lib/types";
import { useLocale } from "@/hooks/use-locale";

interface CategorySelectorProps {
  onSelect: (category: Category) => void;
}

export function CategorySelector({ onSelect }: CategorySelectorProps) {
  const { locale, t } = useLocale();
  const categories: {
    id: Category;
    label: string;
    icon: typeof UtensilsCrossed;
    description: string;
    gradient: string;
    glow: string;
    border: string;
    iconBg: string;
    iconColor: string;
  }[] = [
    {
      id: "restaurant",
      label: t("مطاعم وكافيهات", "Restaurants & Cafes"),
      icon: UtensilsCrossed,
      description: t("صمم بوسترات لوجباتك وعروضك المميزة بلمسة شهية.", "Design delicious-looking posters for your meals and special offers."),
      gradient: "from-orange-500 to-red-500",
      glow: "shadow-orange-500/20",
      border: "border-orange-500/15 hover:border-orange-500/40",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
    },
    {
      id: "supermarket",
      label: t("سوبر ماركت", "Supermarkets"),
      icon: ShoppingCart,
      description: t("عروض المنتجات والخصومات الأسبوعية بتصاميم ملفتة.", "Promote products and weekly discounts with eye-catching visuals."),
      gradient: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-500/20",
      border: "border-emerald-500/15 hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      id: "ecommerce",
      label: t("متاجر إلكترونية", "E-commerce"),
      icon: Store,
      description: t("روّج لمنتجات متجرك الإلكتروني وزد مبيعاتك.", "Promote your online store products and boost sales."),
      gradient: "from-violet-500 to-fuchsia-500",
      glow: "shadow-violet-500/20",
      border: "border-violet-500/15 hover:border-violet-500/40",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
    },
    {
      id: "services",
      label: t("خدمات", "Services"),
      icon: Wrench,
      description: t("إعلانات احترافية لخدمات الصيانة والتنظيف والاستشارات.", "Professional ads for maintenance, cleaning, and consulting services."),
      gradient: "from-blue-500 to-cyan-500",
      glow: "shadow-blue-500/20",
      border: "border-blue-500/15 hover:border-blue-500/40",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      id: "fashion",
      label: t("أزياء وموضة", "Fashion"),
      icon: Shirt,
      description: t("تصاميم أنيقة لعلامتك في عالم الأزياء والإكسسوارات.", "Elegant designs for your fashion and accessories brand."),
      gradient: "from-pink-500 to-rose-500",
      glow: "shadow-pink-500/20",
      border: "border-pink-500/15 hover:border-pink-500/40",
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-400",
    },
    {
      id: "beauty",
      label: t("تجميل وعناية", "Beauty & Care"),
      icon: Sparkles,
      description: t("بوسترات جذابة لصالونات التجميل ومنتجات العناية.", "Attractive posters for salons and beauty care products."),
      gradient: "from-fuchsia-400 to-purple-500",
      glow: "shadow-fuchsia-500/20",
      border: "border-fuchsia-500/15 hover:border-fuchsia-500/40",
      iconBg: "bg-fuchsia-500/10",
      iconColor: "text-fuchsia-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {categories.map((cat) => {
        const Icon = cat.icon;
        return (
          <motion.button
            key={cat.id}
            variants={STAGGER_ITEM}
            whileTap={TAP_SCALE}
            onClick={() => onSelect(cat.id)}
            className={`group relative bg-surface-1 border ${cat.border} rounded-[2rem] p-7 sm:p-8 ${locale === "ar" ? "text-right" : "text-left"} transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${cat.glow} overflow-hidden`}
          >
            {/* Top Gradient Accent Line */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${cat.gradient} opacity-40 group-hover:opacity-100 transition-opacity duration-500`} />
            
            {/* Background Hover Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-16 h-16 ${cat.iconBg} rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 border border-white/5`}>
                  <Icon size={32} className={cat.iconColor} />
                </div>
                
                <div className={`w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center opacity-0 ${locale === "ar" ? "translate-x-4" : "-translate-x-4"} group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 shadow-sm`}>
                   <ArrowLeft size={18} className={`${cat.iconColor} ${locale === "ar" ? "" : "rotate-180"}`} />
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                {cat.label}
              </h3>
              
              <p className="text-muted text-sm sm:text-base font-medium leading-relaxed mb-8 flex-grow">
                {cat.description}
              </p>

              <div className={`inline-flex items-center text-sm font-bold ${cat.iconColor} gap-2 transition-all duration-300 group-hover:gap-3 opacity-80 group-hover:opacity-100`}>
                <span>{t("ابدأ التصميم", "Start design")}</span>
                <ArrowLeft size={16} className={locale === "ar" ? "" : "rotate-180"} />
              </div>
            </div>

            {/* Corner Decorative Glows */}
            <div className={`absolute -bottom-10 ${locale === "ar" ? "-left-10" : "-right-10"} w-40 h-40 bg-gradient-to-tr ${cat.gradient} opacity-10 rounded-full blur-3xl group-hover:opacity-20 group-hover:scale-150 transition-all duration-700 pointer-events-none`} />
            <div className={`absolute -top-10 ${locale === "ar" ? "-right-10" : "-left-10"} w-32 h-32 bg-gradient-to-bl ${cat.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-15 transition-all duration-700 pointer-events-none`} />
          </motion.button>
        );
      })}
    </div>
  );
}
