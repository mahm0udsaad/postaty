"use client";

import { useState } from "react";
import { Store, ShoppingCart, UtensilsCrossed, Tag, Phone, MapPin, Plus, Trash2, Percent } from "lucide-react";
import type { MenuFormData, MenuCategory, CampaignType, MenuItemData } from "@/lib/types";
import { MENU_CONFIG } from "@/lib/constants";
import { ImageUpload } from "../image-upload";
import { CampaignTypeSelector } from "../campaign-type-selector";
import { FormInput } from "../ui/form-input";
import { useLocale } from "@/hooks/use-locale";

interface MenuFormProps {
  menuCategory: MenuCategory;
  onSubmit: (data: MenuFormData) => void;
  isLoading: boolean;
  defaultValues?: { businessName?: string; logo?: string | null };
}

function createEmptyItem(): MenuItemData {
  return { image: "", name: "", price: "", oldPrice: "" };
}

export function MenuForm({ menuCategory, onSubmit, isLoading, defaultValues }: MenuFormProps) {
  const { locale, t } = useLocale();
  const [campaignType, setCampaignType] = useState<CampaignType>("standard");
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined);
  const [items, setItems] = useState<MenuItemData[]>([
    createEmptyItem(),
    createEmptyItem(),
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const logo = logoOverride === undefined ? (defaultValues?.logo ?? null) : logoOverride;

  const updateItem = (index: number, field: keyof MenuItemData, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addItem = () => {
    if (items.length >= MENU_CONFIG.maxItems) return;
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItem = (index: number) => {
    if (items.length <= MENU_CONFIG.minItems) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newErrors: Record<string, string> = {};

    const businessName = (fd.get("businessName") as string)?.trim();
    const whatsapp = (fd.get("whatsapp") as string)?.trim();
    const address = (fd.get("address") as string)?.trim() || undefined;

    if (!businessName) newErrors.businessName = t("اسم النشاط مطلوب", "Business name is required");
    if (!whatsapp) newErrors.whatsapp = t("رقم الواتساب مطلوب", "WhatsApp number is required");
    if (!logo) newErrors.logo = t("اللوجو مطلوب", "Logo is required");

    items.forEach((item, i) => {
      if (!item.image) newErrors[`item_${i}_image`] = t("صورة المنتج مطلوبة", "Product image is required");
      if (!item.name.trim()) newErrors[`item_${i}_name`] = t("اسم المنتج مطلوب", "Product name is required");
      if (!item.price.trim()) newErrors[`item_${i}_price`] = t("السعر مطلوب", "Price is required");
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    onSubmit({
      menuCategory,
      campaignType,
      businessName: businessName!,
      logo: logo!,
      whatsapp: whatsapp!,
      address,
      items: items.map((item) => ({
        image: item.image,
        name: item.name.trim(),
        price: item.price.trim(),
        oldPrice: item.oldPrice?.trim() || undefined,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left column: Business details */}
        <div className="space-y-6">
          <div className="bg-surface-2 p-1 rounded-2xl border border-card-border">
            <CampaignTypeSelector value={campaignType} onChange={setCampaignType} />
          </div>

          <div className="space-y-5">
            <FormInput
              label={t("اسم النشاط التجاري", "Business name")}
              name="businessName"
              placeholder={t("مثال: مطعم الشام", "Example: Al Sham Restaurant")}
              required
              icon={Store}
              defaultValue={defaultValues?.businessName}
              error={errors.businessName}
            />
            <FormInput
              label={t("رقم الواتساب", "WhatsApp number")}
              name="whatsapp"
              type="tel"
              dir="ltr"
              placeholder="+971xxxxxxxxx"
              required
              icon={Phone}
              className="text-left"
              error={errors.whatsapp}
            />
            <FormInput
              label={t("العنوان (اختياري)", "Address (optional)")}
              name="address"
              placeholder={t("مثال: شارع الشيخ زايد، دبي", "Example: Sheikh Zayed Road, Dubai")}
              icon={MapPin}
            />
          </div>
        </div>

        {/* Right column: Logo */}
        <div className="space-y-6">
          <div>
            <ImageUpload
              label={t("لوجو النشاط التجاري", "Business logo")}
              value={logo}
              onChange={setLogoOverride}
            />
            {errors.logo && <p className="text-xs text-red-500 font-medium mt-2">{errors.logo}</p>}
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <label className="text-sm font-semibold text-foreground block">
          {t(`المنتجات (${items.length} من ${MENU_CONFIG.maxItems})`, `Products (${items.length} of ${MENU_CONFIG.maxItems})`)}
        </label>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-surface-2 rounded-2xl border border-card-border p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  {t(`المنتج ${index + 1}`, `Item ${index + 1}`)}
                </span>
                {items.length > MENU_CONFIG.minItems && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Item Image */}
                <div>
                  <ImageUpload
                    label={t("صورة المنتج", "Product image")}
                    value={item.image || null}
                    onChange={(val) => updateItem(index, "image", val ?? "")}
                  />
                  {errors[`item_${index}_image`] && (
                    <p className="text-xs text-red-500 font-medium mt-1">{errors[`item_${index}_image`]}</p>
                  )}
                </div>

                {/* Item Name & Price */}
                <div className="md:col-span-2 space-y-4 flex flex-col justify-center">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">
                      {t("اسم المنتج", "Product name")}
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      placeholder={t("مثال: شاورما دجاج", "Example: Chicken Shawarma")}
                      className={`w-full px-4 py-3 bg-surface-1 border rounded-xl outline-none text-foreground placeholder:text-muted-foreground font-medium transition-all focus:bg-surface-2 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/30 ${
                        errors[`item_${index}_name`] ? "border-red-500 ring-2 ring-red-500/10" : "border-card-border"
                      }`}
                    />
                    {errors[`item_${index}_name`] && (
                      <p className="text-xs text-red-500 font-medium mt-1">{errors[`item_${index}_name`]}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1 block">
                        {t("السعر", "Price")}
                      </label>
                      <div className="relative">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Tag size={16} />
                        </div>
                        <input
                          type="text"
                          value={item.price}
                          onChange={(e) => updateItem(index, "price", e.target.value)}
                          placeholder={t("مثال: 5.99$", "Example: $5.99")}
                          className={`w-full pr-10 pl-4 py-3 bg-surface-1 border rounded-xl outline-none text-foreground placeholder:text-muted-foreground font-medium transition-all focus:bg-surface-2 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/30 ${
                            errors[`item_${index}_price`] ? "border-red-500 ring-2 ring-red-500/10" : "border-card-border"
                          }`}
                        />
                      </div>
                      {errors[`item_${index}_price`] && (
                        <p className="text-xs text-red-500 font-medium mt-1">{errors[`item_${index}_price`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted mb-1 block">
                        {t("السعر القديم (اختياري)", "Old price (optional)")}
                      </label>
                      <div className="relative">
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          <Percent size={16} />
                        </div>
                        <input
                          type="text"
                          value={item.oldPrice ?? ""}
                          onChange={(e) => updateItem(index, "oldPrice", e.target.value)}
                          placeholder={t("مثال: 8.99$", "Example: $8.99")}
                          className="w-full pr-10 pl-4 py-3 bg-surface-1 border border-card-border rounded-xl outline-none text-foreground placeholder:text-muted-foreground font-medium transition-all focus:bg-surface-2 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/30"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {items.length < MENU_CONFIG.maxItems && (
            <button
              type="button"
              onClick={addItem}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-card-border rounded-2xl text-sm font-medium text-muted hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Plus size={16} />
              {t(`إضافة منتج (حتى ${MENU_CONFIG.maxItems})`, `Add item (up to ${MENU_CONFIG.maxItems})`)}

            </button>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="sticky bottom-24 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pb-4 pt-8 -mx-6 px-6 md:static md:bg-none md:p-0 md:m-0 transition-all">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-primary to-primary-hover text-white font-bold rounded-xl shadow-xl shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:translate-y-0 text-lg flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t("جاري تصميم القائمة...", "Generating menu...")}</span>
            </>
          ) : (
            <>
              <span>{t("إنشاء القائمة", "Generate menu")}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm font-bold">
                {MENU_CONFIG.creditsPerMenu} {t("أرصدة", "credits")}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
