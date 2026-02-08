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

// ── Form data validators ───────────────────────────────────────────

export const restaurantFormSchema = z.object({
  category: z.literal("restaurant"),
  campaignType: campaignTypeSchema,
  restaurantName: textFieldSchema("Restaurant name"),
  logo: base64ImageSchema,
  mealImage: base64ImageSchema,
  mealName: textFieldSchema("Meal name"),
  newPrice: priceSchema,
  oldPrice: priceSchema,
  offerDuration: z.string().max(50).optional(),
  whatsapp: phoneSchema,
  cta: textFieldSchema("CTA", 200),
  formats: z.array(outputFormatSchema).min(1, "Select at least one format"),
  brandKitId: z.string().optional(),
});

export const supermarketFormSchema = z.object({
  category: z.literal("supermarket"),
  campaignType: campaignTypeSchema,
  supermarketName: textFieldSchema("Supermarket name"),
  logo: base64ImageSchema,
  productName: textFieldSchema("Product name"),
  productImages: z
    .array(base64ImageSchema)
    .min(1, "At least one product image required")
    .max(5, "Maximum 5 product images"),
  weight: z.string().max(50).optional(),
  offerDuration: z.string().max(50).optional(),
  whatsapp: phoneSchema,
  headline: textFieldSchema("Headline", 200),
  cta: textFieldSchema("CTA", 200),
  formats: z.array(outputFormatSchema).min(1, "Select at least one format"),
  brandKitId: z.string().optional(),
});

export const onlineFormSchema = z.object({
  category: z.literal("online"),
  campaignType: campaignTypeSchema,
  shopName: textFieldSchema("Shop name"),
  logo: base64ImageSchema,
  productImage: base64ImageSchema,
  productName: textFieldSchema("Product name"),
  price: priceSchema,
  discount: z.string().max(50).optional(),
  shipping: z.enum(["free", "paid"]),
  whatsapp: phoneSchema,
  headline: textFieldSchema("Headline", 200),
  cta: textFieldSchema("CTA", 200),
  formats: z.array(outputFormatSchema).min(1, "Select at least one format"),
  brandKitId: z.string().optional(),
});

export const postFormDataSchema = z.discriminatedUnion("category", [
  restaurantFormSchema,
  supermarketFormSchema,
  onlineFormSchema,
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

// ── Export types ────────────────────────────────────────────────────
export type ValidatedPostFormData = z.infer<typeof postFormDataSchema>;
export type ValidatedBrandKit = z.infer<typeof brandKitSchema>;
