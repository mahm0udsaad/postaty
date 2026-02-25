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
    <div role="group" aria-label={t("اختر نوع النشاط التجاري", "Choose business type")} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {categories.map((cat) => {
        const Icon = cat.icon;
        return (
          <motion.button
            key={cat.id}
            variants={STAGGER_ITEM}
            whileTap={TAP_SCALE}
            onClick={() => onSelect(cat.id)}
            aria-label={cat.label}
            className={`group relative bg-surface-1 border ${cat.border} rounded-[2rem] p-8 ${locale === "ar" ? "text-right" : "text-left"} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cat.glow} overflow-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

            <div className="relative z-10 flex flex-col h-full">
              <div className={`w-14 h-14 ${cat.iconBg} rounded-2xl flex items-center justify-center mb-6`}>
                <Icon size={28} className={cat.iconColor} />
              </div>

              <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                {cat.label}
              </h3>
              <p className="text-muted text-sm leading-relaxed mb-8 flex-grow">
                {cat.description}
              </p>

              <div className={`flex items-center text-sm font-bold ${cat.iconColor} group-hover:gap-3 gap-2 transition-all duration-300`}>
                <span>{t("ابدأ التصميم", "Start design")}</span>
                <ArrowLeft size={16} />
              </div>
            </div>

            <div className={`absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr ${cat.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 group-hover:scale-150 transition-all duration-700`} />
          </motion.button>
        );
      })}
    </div>
  );
}
