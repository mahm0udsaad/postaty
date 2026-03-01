import { z } from "zod/v4";

// ── Base validators ────────────────────────────────────────────────

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_SIZE_BYTES * 1.37); // base64 overhead

const base64ImageSchema = z
  .string()
  .max(MAX_BASE64_LENGTH, "Image exceeds 5MB limit")
  .refine(
    (val) =>
      val.startsWith("data:image/jpeg;base64,") ||
      val.startsWith("data:image/png;base64,") ||
      val.startsWith("data:image/webp;base64,"),
    "Image must be JPEG, PNG, or WebP"
  );

const outputFormatSchema = z.enum([
  "instagram-square",
  "instagram-story",
  "facebook-post",
  "facebook-cover",
  "twitter-post",
  "whatsapp-status",
]);

const phoneSchema = z
  .string()
  .min(8, "Phone number too short")
  .max(20, "Phone number too long")
  .regex(/^[\d+\-\s()]+$/, "Invalid phone number format");

const priceSchema = z
  .string()
  .min(1, "Price is required")
  .max(20, "Price too long");

const textFieldSchema = (name: string, maxLen = 100) =>
  z
    .string()
    .min(1, `${name} is required`)
    .max(maxLen, `${name} is too long (max ${maxLen} chars)`);

const campaignTypeSchema = z.enum(["standard", "ramadan", "eid"]);

const formatSchema = outputFormatSchema;

// ── Form data validators ───────────────────────────────────────────

export const restaurantFormSchema = z.object({
  category: z.literal("restaurant"),
  campaignType: campaignTypeSchema,
  restaurantName: textFieldSchema("Restaurant name"),
  logo: base64ImageSchema,
  mealImage: base64ImageSchema,
  postType: z.enum(["menu", "meal-offer", "delivery"]),
  mealName: textFieldSchema("Meal name"),
  description: z.string().max(200).optional(),
  newPrice: priceSchema,
  oldPrice: priceSchema,
  offerBadge: z.enum(["discount", "new", "bestseller"]).optional(),
  deliveryType: z.enum(["free", "paid"]).optional(),
  deliveryTime: z.string().max(50).optional(),
  coverageAreas: z.string().max(200).optional(),
  offerDuration: z.string().max(50).optional(),
  whatsapp: phoneSchema,
  cta: textFieldSchema("CTA", 200),
  format: formatSchema,
  brandKitId: z.string().optional(),
});

export const supermarketFormSchema = z.object({
  category: z.literal("supermarket"),
  campaignType: campaignTypeSchema,
  supermarketName: textFieldSchema("Supermarket name"),
  logo: base64ImageSchema,
  productImages: z
    .array(base64ImageSchema)
    .min(1, "At least one product image required")
    .max(5, "Maximum 5 product images"),
  postType: z.enum(["product", "daily-offers", "section-sales"]),
  productName: textFieldSchema("Product name"),
  quantity: z.string().max(50).optional(),
  newPrice: priceSchema,
  oldPrice: priceSchema,
  discountPercentage: z.string().max(10).optional(),
  offerLimit: z.string().max(100).optional(),
  offerDuration: z.string().max(50).optional(),
  expiryDate: z.string().max(50).optional(),
  whatsapp: phoneSchema,
  cta: textFieldSchema("CTA", 200),
  format: formatSchema,
  brandKitId: z.string().optional(),
});

export const ecommerceFormSchema = z.object({
  category: z.literal("ecommerce"),
  campaignType: campaignTypeSchema,
  shopName: textFieldSchema("Shop name"),
  logo: base64ImageSchema,
  productImage: base64ImageSchema,
  postType: z.enum(["product", "sales", "new-arrival"]),
  productName: textFieldSchema("Product name"),
  features: z.string().max(200).optional(),
  newPrice: priceSchema,
  oldPrice: priceSchema,
  colorSize: z.string().max(100).optional(),
  availability: z.enum(["in-stock", "out-of-stock", "preorder"]),
  shippingDuration: z.string().max(50).optional(),
  purchaseLink: z.string().max(500).optional(),
  whatsapp: phoneSchema,
  cta: textFieldSchema("CTA", 200),
  format: formatSchema,
  brandKitId: z.string().optional(),
});

export const servicesFormSchema = z.object({
  category: z.literal("services"),
  campaignType: campaignTypeSchema,
  businessName: textFieldSchema("Business name"),
  logo: base64ImageSchema,
  serviceImage: base64ImageSchema,
  serviceType: z.string().min(1, "Service type is required").max(50),
  serviceName: textFieldSchema("Service name"),
  serviceDetails: z.string().max(200).optional(),
  price: priceSchema,
  priceType: z.enum(["fixed", "starting-from"]),
  executionTime: z.string().max(50).optional(),
  coverageArea: z.string().max(200).optional(),
  warranty: z.string().max(100).optional(),
  quickFeatures: z.string().max(200).optional(),
  offerDuration: z.string().max(50).optional(),
  whatsapp: phoneSchema,
  cta: textFieldSchema("CTA", 200),
  format: formatSchema,
  brandKitId: z.string().optional(),
});

export const fashionFormSchema = z.object({
  category: z.literal("fashion"),
  campaignType: campaignTypeSchema,
  brandName: textFieldSchema("Brand name"),
  logo: base64ImageSchema,
  productImage: base64ImageSchema,
  postType: z.enum(["product", "discount", "collection"]),
  itemName: textFieldSchema("Item name"),
  description: z.string().max(200).optional(),
  newPrice: priceSchema,
  oldPrice: priceSchema,
  availableSizes: z.string().max(100).optional(),
  availableColors: z.string().max(100).optional(),
  offerNote: z.string().max(200).optional(),
  offerDuration: z.string().max(50).optional(),
  whatsapp: phoneSchema,
  cta: textFieldSchema("CTA", 200),
  format: formatSchema,
  brandKitId: z.string().optional(),
});

export const beautyFormSchema = z.object({
  category: z.literal("beauty"),
  campaignType: campaignTypeSchema,
  salonName: textFieldSchema("Salon name"),
  logo: base64ImageSchema,
  serviceImage: base64ImageSchema,
  postType: z.enum(["salon-service", "spa-session", "beauty-product"]),
  serviceName: textFieldSchema("Service name"),
  benefit: z.string().max(200).optional(),
  newPrice: priceSchema,
  oldPrice: priceSchema,
  sessionDuration: z.string().max(50).optional(),
  suitableFor: z.string().max(200).optional(),
  bookingCondition: z.enum(["advance", "available-now"]),
  offerDuration: z.string().max(50).optional(),
  whatsapp: phoneSchema,
  cta: textFieldSchema("CTA", 200),
  format: formatSchema,
  brandKitId: z.string().optional(),
});

export const postFormDataSchema = z.discriminatedUnion("category", [
  restaurantFormSchema,
  supermarketFormSchema,
  ecommerceFormSchema,
  servicesFormSchema,
  fashionFormSchema,
  beautyFormSchema,
]);

// ── Brand kit validators ───────────────────────────────────────────

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #FF5733)");

export const brandKitSchema = z.object({
  name: textFieldSchema("Brand kit name"),
  palette: z.object({
    primary: hexColorSchema,
    secondary: hexColorSchema,
    accent: hexColorSchema,
    background: hexColorSchema,
    text: hexColorSchema,
  }),
  fontFamily: z.string().min(1).max(100),
  styleAdjectives: z
    .array(
      z.enum([
        "luxury",
        "minimal",
        "warm",
        "bold",
        "playful",
        "elegant",
        "modern",
        "traditional",
        "vibrant",
        "professional",
        "friendly",
        "premium",
      ])
    )
    .max(5, "Maximum 5 style adjectives"),
  doRules: z
    .array(z.string().max(200))
    .max(10, "Maximum 10 do-rules"),
  dontRules: z
    .array(z.string().max(200))
    .max(10, "Maximum 10 don't-rules"),
  isDefault: z.boolean(),
});

// ── Menu form validators ──────────────────────────────────────────

const menuItemSchema = z.object({
  image: base64ImageSchema,
  name: textFieldSchema("Item name"),
  price: priceSchema,
  oldPrice: z.string().max(50).optional(),
});

export const menuFormDataSchema = z.object({
  menuCategory: z.enum(["restaurant", "supermarket"]),
  campaignType: campaignTypeSchema,
  businessName: textFieldSchema("Business name"),
  logo: base64ImageSchema,
  whatsapp: phoneSchema,
  address: z.string().max(200).optional(),
  items: z
    .array(menuItemSchema)
    .min(2, "At least 2 items required")
    .max(6, "Maximum 6 items"),
  brandKitId: z.string().optional(),
});

// ── Export types ────────────────────────────────────────────────────
export type ValidatedPostFormData = z.infer<typeof postFormDataSchema>;
export type ValidatedMenuFormData = z.infer<typeof menuFormDataSchema>;
export type ValidatedBrandKit = z.infer<typeof brandKitSchema>;
