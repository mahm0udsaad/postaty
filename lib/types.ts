import type { Id } from "@/convex/_generated/dataModel";

// ── Categories & Formats ───────────────────────────────────────────
export type Category = "restaurant" | "supermarket" | "online";

export type OutputFormat =
  | "instagram-square"
  | "instagram-story"
  | "facebook-post"
  | "facebook-cover"
  | "twitter-post"
  | "whatsapp-status";

export interface FormatConfig {
  label: string;
  aspectRatio: string;
  width: number;
  height: number;
}

// ── Form Data ──────────────────────────────────────────────────────
export interface RestaurantFormData {
  category: "restaurant";
  restaurantName: string;
  logo: string; // base64
  mealImage: string; // base64
  mealName: string;
  newPrice: string;
  oldPrice: string;
  offerDuration?: string;
  whatsapp: string;
  cta: string;
  formats: OutputFormat[];
  brandKitId?: string;
}

export interface SupermarketFormData {
  category: "supermarket";
  supermarketName: string;
  logo: string; // base64
  productName: string;
  productImages: string[]; // base64[]
  weight?: string;
  offerDuration?: string;
  whatsapp: string;
  headline: string;
  cta: string;
  formats: OutputFormat[];
  brandKitId?: string;
}

export interface OnlineFormData {
  category: "online";
  shopName: string;
  logo: string; // base64
  productImage: string; // base64
  productName: string;
  price: string;
  discount?: string;
  shipping: "free" | "paid";
  whatsapp: string;
  headline: string;
  cta: string;
  formats: OutputFormat[];
  brandKitId?: string;
}

export type PostFormData =
  | RestaurantFormData
  | SupermarketFormData
  | OnlineFormData;

// ── Generation ─────────────────────────────────────────────────────
export interface GenerationResult {
  format: OutputFormat;
  imageBase64: string;
  storageId?: string;
  storageUrl?: string; // Resolved URL from Convex storage (used in history page)
  status: "pending" | "generating" | "complete" | "error";
  error?: string;
}

export interface GenerationState {
  step: "idle" | "crafting-prompt" | "generating-images" | "complete" | "error";
  currentFormat?: OutputFormat;
  results: GenerationResult[];
  error?: string;
  craftedPrompt?: string;
}

// ── Brand Kit ──────────────────────────────────────────────────────
export interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export type StyleAdjective =
  | "luxury"
  | "minimal"
  | "warm"
  | "bold"
  | "playful"
  | "elegant"
  | "modern"
  | "traditional"
  | "vibrant"
  | "professional"
  | "friendly"
  | "premium";

export interface BrandKit {
  _id: Id<"brand_kits">;
  orgId: Id<"organizations">;
  name: string;
  logoStorageId?: Id<"_storage">;
  logoUrl?: string;
  palette: BrandPalette;
  extractedColors: string[];
  fontFamily: string;
  styleAdjectives: string[];
  doRules: string[];
  dontRules: string[];
  styleSeed?: string;
  isDefault: boolean;
  updatedAt: number;
}

// ── Templates ──────────────────────────────────────────────────────
export type TemplateCategory =
  | "sale"
  | "new_arrival"
  | "minimal"
  | "luxury"
  | "food"
  | "electronics"
  | "fashion"
  | "general";

export type LayerType =
  | "background"
  | "image"
  | "logo"
  | "text"
  | "shape"
  | "badge";

export interface BackgroundProps {
  fill: string;
  gradient?: { from: string; to: string; angle: number };
  imageStorageId?: string;
}

export interface TextProps {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold" | "extrabold";
  color: string;
  align: "right" | "center" | "left";
  direction: "rtl" | "ltr";
  maxLines: number;
  editable: boolean;
  binding?: string; // e.g. "productName", "price", "cta"
}

export interface ImageProps {
  storageId?: string;
  fit: "cover" | "contain" | "fill";
  borderRadius: number;
  editable: boolean;
  binding?: string; // e.g. "productImage", "logo"
}

export interface ShapeProps {
  shape: "rectangle" | "circle" | "rounded-rect" | "badge";
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
}

export interface BadgeProps {
  text: string;
  style: "circle" | "ribbon" | "starburst";
  backgroundColor: string;
  textColor: string;
  editable: boolean;
}

export type LayerProps =
  | BackgroundProps
  | TextProps
  | ImageProps
  | ShapeProps
  | BadgeProps;

export interface TemplateLayer {
  id: string;
  type: LayerType;
  label: string;
  labelAr: string;
  x: number; // 0-1 relative
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  props: LayerProps;
}

// ── Credits ────────────────────────────────────────────────────────
export type CreditReason =
  | "generation"
  | "refund"
  | "purchase"
  | "monthly_allowance"
  | "admin_adjustment";

export type OrgPlan = "free" | "starter" | "pro" | "agency";

export interface PlanLimits {
  creditsMonthly: number;
  maxConcurrentGenerations: number;
  maxBrandKits: number;
  maxCustomTemplates: number;
  exportFormats: OutputFormat[];
  hasWatermark: boolean;
  historyRetentionDays: number;
}
