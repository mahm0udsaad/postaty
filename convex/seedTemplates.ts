import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded - OPTIONAL: we might want to force update if the user wants "fresh" templates
    // For now, I'll assume we want to upsert or add these. 
    // Since the instruction implies "update each one", I should ideally check if they exist and update, 
    // but the seed function usually runs once. 
    // To ensure the user sees the new templates, I will add a version check or just delete old system templates and re-seed.
    
    // First, let's remove existing system templates to ensure a clean slate with the new designs.
    const existingTemplates = await ctx.db
      .query("templates")
      .withIndex("by_isSystem", (q) => q.eq("isSystem", true))
      .collect();

    for (const t of existingTemplates) {
      await ctx.db.delete(t._id);
    }

    const templates = [
      // 1. Modern Dark Sale (Neon/Cyberpunk vibes) - High contrast, impactful
      {
        slug: "sale-neon-dark",
        name: "Neon Dark Sale",
        nameAr: "عرض نيون داكن",
        category: "sale" as const,
        supportedFormats: ["instagram-square", "instagram-story", "facebook-post"],
        layers: [
          { id: "bg", type: "background" as const, label: "Background", labelAr: "الخلفية", x: 0, y: 0, width: 1, height: 1, rotation: 0, zIndex: 0, visible: true, locked: true, props: { fill: "#09090b", gradient: { from: "#09090b", to: "#18181b", angle: 135 } } },
          // Decorative circle behind product
          { id: "shape1", type: "shape" as const, label: "Glow", labelAr: "توهج", x: 0.15, y: 0.15, width: 0.7, height: 0.5, rotation: 0, zIndex: 1, visible: true, locked: true, props: { shape: "circle", fill: "#7c3aed", stroke: "transparent", strokeWidth: 0, borderRadius: 500 } }, // Purple glow
          { id: "product", type: "image" as const, label: "Product", labelAr: "المنتج", x: 0.1, y: 0.1, width: 0.8, height: 0.5, rotation: 0, zIndex: 2, visible: true, locked: false, props: { fit: "contain", borderRadius: 24, editable: true, binding: "productImage" } },
          { id: "title", type: "text" as const, label: "Headline", labelAr: "العنوان الرئيسي", x: 0.05, y: 0.62, width: 0.9, height: 0.08, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "عروض الجمعة", fontFamily: "Noto Kufi Arabic", fontSize: 56, fontWeight: "extrabold", color: "#ffffff", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "headline" } },
          { id: "subtitle", type: "text" as const, label: "Subtitle", labelAr: "العنوان الفرعي", x: 0.1, y: 0.72, width: 0.8, height: 0.05, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "خصومات تصل إلى ٧٠٪", fontFamily: "Noto Kufi Arabic", fontSize: 28, fontWeight: "bold", color: "#a78bfa", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "productName" } },
          { id: "price", type: "text" as const, label: "Price", labelAr: "السعر", x: 0.2, y: 0.78, width: 0.6, height: 0.08, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "199 ر.س", fontFamily: "Noto Kufi Arabic", fontSize: 48, fontWeight: "extrabold", color: "#4ade80", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "price" } },
          { id: "cta", type: "badge" as const, label: "CTA", labelAr: "زر الحث", x: 0.25, y: 0.88, width: 0.5, height: 0.07, rotation: 0, zIndex: 4, visible: true, locked: false, props: { text: "تسوق الآن", style: "ribbon", backgroundColor: "#7c3aed", textColor: "#ffffff", editable: true } },
        ],
      },

      // 2. Luxury Gold (Premium/Ramadan friendly) - Elegant, gold/black theme
      {
        slug: "luxury-gold-v2",
        name: "Premium Gold",
        nameAr: "ذهبي فاخر",
        category: "luxury" as const,
        supportedFormats: ["instagram-square", "instagram-story"],
        layers: [
          { id: "bg", type: "background" as const, label: "Background", labelAr: "الخلفية", x: 0, y: 0, width: 1, height: 1, rotation: 0, zIndex: 0, visible: true, locked: true, props: { fill: "#000000", gradient: { from: "#1c1917", to: "#000000", angle: 180 } } },
          // Elegant border
          { id: "border", type: "shape" as const, label: "Border", labelAr: "الإطار", x: 0.04, y: 0.04, width: 0.92, height: 0.92, rotation: 0, zIndex: 1, visible: true, locked: true, props: { shape: "rounded-rect", fill: "transparent", stroke: "#fbbf24", strokeWidth: 1.5, borderRadius: 0 } },
          { id: "product", type: "image" as const, label: "Product", labelAr: "المنتج", x: 0.15, y: 0.15, width: 0.7, height: 0.45, rotation: 0, zIndex: 2, visible: true, locked: false, props: { fit: "contain", borderRadius: 8, editable: true, binding: "productImage" } },
          { id: "logo", type: "logo" as const, label: "Logo", labelAr: "الشعار", x: 0.4, y: 0.06, width: 0.2, height: 0.06, rotation: 0, zIndex: 5, visible: true, locked: false, props: { fit: "contain", borderRadius: 0, editable: true, binding: "logo" } },
          { id: "title", type: "text" as const, label: "Title", labelAr: "العنوان", x: 0.1, y: 0.65, width: 0.8, height: 0.08, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "مجموعة فاخرة", fontFamily: "Noto Kufi Arabic", fontSize: 40, fontWeight: "extrabold", color: "#fbbf24", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "headline" } },
          { id: "subtitle", type: "text" as const, label: "Subtitle", labelAr: "الوصف", x: 0.15, y: 0.74, width: 0.7, height: 0.06, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "أناقة لا تضاهى", fontFamily: "Noto Kufi Arabic", fontSize: 24, fontWeight: "normal", color: "#d6d3d1", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "productName" } },
          { id: "cta", type: "badge" as const, label: "CTA", labelAr: "زر الحث", x: 0.3, y: 0.85, width: 0.4, height: 0.06, rotation: 0, zIndex: 4, visible: true, locked: false, props: { text: "اكتشف المزيد", style: "ribbon", backgroundColor: "#fbbf24", textColor: "#1c1917", editable: true } },
        ],
      },

      // 3. Modern Food (Clean/Appetizing) - Warm colors, organic shapes
      {
        slug: "food-modern-v2",
        name: "Fresh Food",
        nameAr: "طعام طازج",
        category: "food" as const,
        supportedFormats: ["instagram-square", "facebook-post"],
        layers: [
          { id: "bg", type: "background" as const, label: "Background", labelAr: "الخلفية", x: 0, y: 0, width: 1, height: 1, rotation: 0, zIndex: 0, visible: true, locked: true, props: { fill: "#fffbeb" } }, // Warm off-white
          // Organic shape accent (simulated with rounded rect)
          { id: "accent", type: "shape" as const, label: "Accent", labelAr: "شكل جمالي", x: -0.1, y: -0.1, width: 0.6, height: 0.6, rotation: 45, zIndex: 1, visible: true, locked: true, props: { shape: "circle", fill: "#fef3c7", stroke: "transparent", strokeWidth: 0, borderRadius: 500 } },
          { id: "product", type: "image" as const, label: "Dish", labelAr: "الطبق", x: 0.05, y: 0.1, width: 0.9, height: 0.5, rotation: 0, zIndex: 2, visible: true, locked: false, props: { fit: "cover", borderRadius: 32, editable: true, binding: "productImage" } },
          { id: "title", type: "text" as const, label: "Dish Name", labelAr: "اسم الطبق", x: 0.05, y: 0.64, width: 0.9, height: 0.08, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "برجر اللحم المشوي", fontFamily: "Noto Kufi Arabic", fontSize: 42, fontWeight: "extrabold", color: "#92400e", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "productName" } },
          { id: "desc", type: "text" as const, label: "Description", labelAr: "الوصف", x: 0.1, y: 0.72, width: 0.8, height: 0.06, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "طعم لا يقاوم، اطلبه الآن", fontFamily: "Noto Kufi Arabic", fontSize: 24, fontWeight: "normal", color: "#b45309", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "headline" } },
          { id: "price", type: "text" as const, label: "Price", labelAr: "السعر", x: 0.1, y: 0.82, width: 0.35, height: 0.08, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "٤٥ ر.س", fontFamily: "Noto Kufi Arabic", fontSize: 40, fontWeight: "extrabold", color: "#dc2626", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "price" } },
          { id: "cta", type: "badge" as const, label: "Order Btn", labelAr: "زر الطلب", x: 0.5, y: 0.82, width: 0.4, height: 0.08, rotation: 0, zIndex: 4, visible: true, locked: false, props: { text: "أضف للسلة", style: "ribbon", backgroundColor: "#dc2626", textColor: "#ffffff", editable: true } },
        ],
      },

      // 4. Tech/Electronics (Sleek/Blue) - Trustworthy, clean lines
      {
        slug: "tech-sleek",
        name: "Sleek Tech",
        nameAr: "تقنية عصرية",
        category: "electronics" as const,
        supportedFormats: ["instagram-square", "facebook-post"],
        layers: [
          { id: "bg", type: "background" as const, label: "Background", labelAr: "الخلفية", x: 0, y: 0, width: 1, height: 1, rotation: 0, zIndex: 0, visible: true, locked: true, props: { fill: "#f1f5f9" } },
          { id: "panel", type: "shape" as const, label: "Panel", labelAr: "لوحة", x: 0.05, y: 0.05, width: 0.9, height: 0.9, rotation: 0, zIndex: 1, visible: true, locked: true, props: { shape: "rounded-rect", fill: "#ffffff", stroke: "transparent", strokeWidth: 0, borderRadius: 24 } },
          { id: "product", type: "image" as const, label: "Gadget", labelAr: "الجهاز", x: 0.1, y: 0.1, width: 0.8, height: 0.45, rotation: 0, zIndex: 2, visible: true, locked: false, props: { fit: "contain", borderRadius: 16, editable: true, binding: "productImage" } },
          { id: "new-badge", type: "badge" as const, label: "New", labelAr: "جديد", x: 0.1, y: 0.08, width: 0.2, height: 0.05, rotation: 0, zIndex: 5, visible: true, locked: false, props: { text: "جديد", style: "ribbon", backgroundColor: "#0284c7", textColor: "#ffffff", editable: false } },
          { id: "title", type: "text" as const, label: "Product Name", labelAr: "اسم المنتج", x: 0.1, y: 0.6, width: 0.8, height: 0.08, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "سماعات برو", fontFamily: "Noto Kufi Arabic", fontSize: 36, fontWeight: "extrabold", color: "#0f172a", align: "right", direction: "rtl", maxLines: 1, editable: true, binding: "headline" } },
          { id: "features", type: "text" as const, label: "Features", labelAr: "المميزات", x: 0.1, y: 0.68, width: 0.8, height: 0.1, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "جودة صوت فائقة • بطارية طويلة", fontFamily: "Noto Kufi Arabic", fontSize: 20, fontWeight: "normal", color: "#64748b", align: "right", direction: "rtl", maxLines: 2, editable: true, binding: "productName" } },
          { id: "price", type: "text" as const, label: "Price", labelAr: "السعر", x: 0.1, y: 0.8, width: 0.4, height: 0.08, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "999 ر.س", fontFamily: "Noto Kufi Arabic", fontSize: 40, fontWeight: "extrabold", color: "#0284c7", align: "right", direction: "rtl", maxLines: 1, editable: true, binding: "price" } },
          { id: "cta", type: "badge" as const, label: "Buy", labelAr: "شراء", x: 0.6, y: 0.8, width: 0.3, height: 0.08, rotation: 0, zIndex: 4, visible: true, locked: false, props: { text: "شراء", style: "ribbon", backgroundColor: "#0f172a", textColor: "#ffffff", editable: true } },
        ],
      },

      // 5. Fashion/Minimal (Editorial feel) - Large image, clean typography
      {
        slug: "fashion-editorial",
        name: "Editorial Fashion",
        nameAr: "موضة افتتاحية",
        category: "fashion" as const,
        supportedFormats: ["instagram-story", "facebook-post"],
        layers: [
          { id: "bg", type: "background" as const, label: "Background", labelAr: "الخلفية", x: 0, y: 0, width: 1, height: 1, rotation: 0, zIndex: 0, visible: true, locked: true, props: { fill: "#fdf2f8" } },
          { id: "product", type: "image" as const, label: "Look", labelAr: "الإطلالة", x: 0, y: 0, width: 1, height: 0.65, rotation: 0, zIndex: 1, visible: true, locked: false, props: { fit: "cover", borderRadius: 0, editable: true, binding: "productImage" } },
          { id: "title", type: "text" as const, label: "Collection", labelAr: "المجموعة", x: 0.1, y: 0.7, width: 0.8, height: 0.08, rotation: 0, zIndex: 2, visible: true, locked: false, props: { content: "مجموعة الصيف", fontFamily: "Noto Kufi Arabic", fontSize: 44, fontWeight: "extrabold", color: "#831843", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "headline" } },
          { id: "subtitle", type: "text" as const, label: "Subtitle", labelAr: "فرعي", x: 0.15, y: 0.78, width: 0.7, height: 0.06, rotation: 0, zIndex: 2, visible: true, locked: false, props: { content: "أناقة بلا حدود", fontFamily: "Noto Kufi Arabic", fontSize: 24, fontWeight: "normal", color: "#9d174d", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "productName" } },
          { id: "cta", type: "badge" as const, label: "Shop", labelAr: "تسوق", x: 0.3, y: 0.88, width: 0.4, height: 0.06, rotation: 0, zIndex: 3, visible: true, locked: false, props: { text: "تسوقي الآن", style: "ribbon", backgroundColor: "#831843", textColor: "#ffffff", editable: true } },
        ],
      },

      // 6. Vibrant General (Pop Art/Bold) - Gradient background, white text
      {
        slug: "vibrant-pop",
        name: "Vibrant Pop",
        nameAr: "ألوان حيوية",
        category: "general" as const,
        supportedFormats: ["instagram-square", "instagram-story", "facebook-post"],
        layers: [
          { id: "bg", type: "background" as const, label: "Background", labelAr: "الخلفية", x: 0, y: 0, width: 1, height: 1, rotation: 0, zIndex: 0, visible: true, locked: true, props: { fill: "#4f46e5", gradient: { from: "#4f46e5", to: "#ec4899", angle: 45 } } },
          { id: "product", type: "image" as const, label: "Image", labelAr: "الصورة", x: 0.1, y: 0.15, width: 0.8, height: 0.4, rotation: 0, zIndex: 1, visible: true, locked: false, props: { fit: "contain", borderRadius: 16, editable: true, binding: "productImage" } },
          { id: "title", type: "text" as const, label: "Headline", labelAr: "العنوان", x: 0.05, y: 0.6, width: 0.9, height: 0.1, rotation: 0, zIndex: 2, visible: true, locked: false, props: { content: "لا تفوت العرض", fontFamily: "Noto Kufi Arabic", fontSize: 52, fontWeight: "extrabold", color: "#ffffff", align: "center", direction: "rtl", maxLines: 2, editable: true, binding: "headline" } },
          { id: "price", type: "text" as const, label: "Price", labelAr: "السعر", x: 0.2, y: 0.72, width: 0.6, height: 0.08, rotation: 0, zIndex: 2, visible: true, locked: false, props: { content: "٥٠٪ خصم", fontFamily: "Noto Kufi Arabic", fontSize: 48, fontWeight: "extrabold", color: "#fef08a", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "price" } },
          { id: "cta", type: "badge" as const, label: "CTA", labelAr: "زر", x: 0.2, y: 0.85, width: 0.6, height: 0.08, rotation: 0, zIndex: 3, visible: true, locked: false, props: { text: "احصل عليه الآن", style: "ribbon", backgroundColor: "#ffffff", textColor: "#4f46e5", editable: true } },
        ],
      },
      
      // 7. Minimal White (Professional/Corporate)
      {
        slug: "minimal-clean-v2",
        name: "Minimal Clean",
        nameAr: "بسيط نظيف",
        category: "minimal" as const,
        supportedFormats: ["instagram-square", "facebook-post"],
        layers: [
          { id: "bg", type: "background" as const, label: "Background", labelAr: "الخلفية", x: 0, y: 0, width: 1, height: 1, rotation: 0, zIndex: 0, visible: true, locked: true, props: { fill: "#ffffff" } },
          { id: "product", type: "image" as const, label: "Product", labelAr: "المنتج", x: 0.1, y: 0.1, width: 0.8, height: 0.5, rotation: 0, zIndex: 1, visible: true, locked: false, props: { fit: "contain", borderRadius: 0, editable: true, binding: "productImage" } },
          { id: "title", type: "text" as const, label: "Title", labelAr: "العنوان", x: 0.1, y: 0.65, width: 0.8, height: 0.06, rotation: 0, zIndex: 2, visible: true, locked: false, props: { content: "بساطة التصميم", fontFamily: "Noto Kufi Arabic", fontSize: 36, fontWeight: "bold", color: "#18181b", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "headline" } },
          { id: "desc", type: "text" as const, label: "Description", labelAr: "الوصف", x: 0.15, y: 0.72, width: 0.7, height: 0.05, rotation: 0, zIndex: 2, visible: true, locked: false, props: { content: "جودة عالية وسعر مناسب", fontFamily: "Noto Kufi Arabic", fontSize: 20, fontWeight: "normal", color: "#52525b", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "productName" } },
          { id: "price", type: "text" as const, label: "Price", labelAr: "السعر", x: 0.3, y: 0.8, width: 0.4, height: 0.06, rotation: 0, zIndex: 2, visible: true, locked: false, props: { content: "١٢٠ ر.س", fontFamily: "Noto Kufi Arabic", fontSize: 32, fontWeight: "bold", color: "#18181b", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "price" } },
        ]
      },
      
      // 8. Ramadan Special (Traditional) - Pattern inspired
      {
        slug: "ramadan-nights",
        name: "Ramadan Nights",
        nameAr: "ليالي رمضان",
        category: "sale" as const, // Could be general or sale
        supportedFormats: ["instagram-square", "instagram-story"],
        layers: [
          { id: "bg", type: "background" as const, label: "Background", labelAr: "الخلفية", x: 0, y: 0, width: 1, height: 1, rotation: 0, zIndex: 0, visible: true, locked: true, props: { fill: "#1e1b4b", gradient: { from: "#1e1b4b", to: "#312e81", angle: 180 } } },
          // Decorative moon/circle
          { id: "moon", type: "shape" as const, label: "Moon", labelAr: "قمر", x: 0.6, y: 0.05, width: 0.3, height: 0.3, rotation: 0, zIndex: 1, visible: true, locked: true, props: { shape: "circle", fill: "#fde047", stroke: "transparent", strokeWidth: 0, borderRadius: 500 } },
          { id: "moon-mask", type: "shape" as const, label: "Moon Mask", labelAr: "قناع", x: 0.55, y: 0.05, width: 0.3, height: 0.3, rotation: 0, zIndex: 1, visible: true, locked: true, props: { shape: "circle", fill: "#1e1b4b", stroke: "transparent", strokeWidth: 0, borderRadius: 500 } },
          
          { id: "product", type: "image" as const, label: "Product", labelAr: "المنتج", x: 0.1, y: 0.2, width: 0.8, height: 0.4, rotation: 0, zIndex: 2, visible: true, locked: false, props: { fit: "contain", borderRadius: 16, editable: true, binding: "productImage" } },
          { id: "title", type: "text" as const, label: "Title", labelAr: "العنوان", x: 0.05, y: 0.65, width: 0.9, height: 0.08, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "عروض الشهر الفضيل", fontFamily: "Noto Kufi Arabic", fontSize: 40, fontWeight: "extrabold", color: "#fde047", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "headline" } },
          { id: "subtitle", type: "text" as const, label: "Subtitle", labelAr: "فرعي", x: 0.1, y: 0.75, width: 0.8, height: 0.06, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "رمضان كريم", fontFamily: "Noto Kufi Arabic", fontSize: 28, fontWeight: "bold", color: "#ffffff", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "productName" } },
          { id: "cta", type: "badge" as const, label: "CTA", labelAr: "زر", x: 0.25, y: 0.86, width: 0.5, height: 0.07, rotation: 0, zIndex: 4, visible: true, locked: false, props: { text: "تسوق العروض", style: "ribbon", backgroundColor: "#fde047", textColor: "#1e1b4b", editable: true } },
        ]
      },

      // 9. New Arrival (Streetwear/Bold) - High energy
      {
        slug: "new-drop-street",
        name: "Streetwear Drop",
        nameAr: "إصدار جديد",
        category: "new_arrival" as const,
        supportedFormats: ["instagram-square", "instagram-story"],
        layers: [
          { id: "bg", type: "background" as const, label: "Background", labelAr: "الخلفية", x: 0, y: 0, width: 1, height: 1, rotation: 0, zIndex: 0, visible: true, locked: true, props: { fill: "#000000" } },
          { id: "stripe", type: "shape" as const, label: "Stripe", labelAr: "شريط", x: 0, y: 0.6, width: 1, height: 0.15, rotation: -10, zIndex: 1, visible: true, locked: true, props: { shape: "rounded-rect", fill: "#eab308", stroke: "transparent", strokeWidth: 0, borderRadius: 0 } },
          { id: "product", type: "image" as const, label: "Product", labelAr: "المنتج", x: 0.1, y: 0.15, width: 0.8, height: 0.5, rotation: 0, zIndex: 2, visible: true, locked: false, props: { fit: "contain", borderRadius: 0, editable: true, binding: "productImage" } },
          { id: "title", type: "text" as const, label: "Headline", labelAr: "العنوان", x: 0.05, y: 0.05, width: 0.9, height: 0.12, rotation: 0, zIndex: 3, visible: true, locked: false, props: { content: "وصل حديثاً", fontFamily: "Noto Kufi Arabic", fontSize: 60, fontWeight: "extrabold", color: "#ffffff", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "headline" } },
          { id: "subtitle", type: "text" as const, label: "Subtitle", labelAr: "فرعي", x: 0.1, y: 0.65, width: 0.8, height: 0.06, rotation: -10, zIndex: 3, visible: true, locked: false, props: { content: "تصميم حصري", fontFamily: "Noto Kufi Arabic", fontSize: 32, fontWeight: "bold", color: "#000000", align: "center", direction: "rtl", maxLines: 1, editable: true, binding: "productName" } },
          { id: "cta", type: "badge" as const, label: "CTA", labelAr: "زر", x: 0.3, y: 0.85, width: 0.4, height: 0.08, rotation: 0, zIndex: 4, visible: true, locked: false, props: { text: "احجزه الآن", style: "ribbon", backgroundColor: "#ffffff", textColor: "#000000", editable: true } },
        ]
      }
    ];

    for (const t of templates) {
      await ctx.db.insert("templates", {
        ...t,
        isSystem: true,
        orgId: undefined,
        parentTemplateId: undefined,
        parentVersion: undefined,
        version: 1,
        locales: ["ar"],
        createdAt: Date.now(),
      });
    }

    return { message: `Re-seeded ${templates.length} stunning templates` };
  },
});
