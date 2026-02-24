import type { Id } from "@/convex/_generated/dataModel";

// ── Categories & Formats ───────────────────────────────────────────
export type Category = "restaurant" | "supermarket" | "ecommerce" | "services" | "fashion" | "beauty";
export type CampaignType = "standard" | "ramadan" | "eid";

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
  campaignType: CampaignType;
  restaurantName: string;
  logo: string; // base64
  mealImage: string; // base64
  postType: "menu" | "meal-offer" | "delivery";
  mealName: string;
  description?: string;
  newPrice: string;
  oldPrice: string;
  offerBadge?: "discount" | "new" | "bestseller";
  deliveryType?: "free" | "paid";
  deliveryTime?: string;
  coverageAreas?: string;
  offerDuration?: string;
  whatsapp: string;
  cta: string;
  format: OutputFormat;
  brandKitId?: string;
}

export interface SupermarketFormData {
  category: "supermarket";
  campaignType: CampaignType;
  supermarketName: string;
  logo: string; // base64
  productImages: string[]; // base64[]
  postType: "product" | "daily-offers" | "section-sales";
  productName: string;
  quantity?: string;
  newPrice: string;
  oldPrice: string;
  discountPercentage?: string;
  offerLimit?: string;
  offerDuration?: string;
  expiryDate?: string;
  whatsapp: string;
  cta: string;
  format: OutputFormat;
  brandKitId?: string;
}

export interface EcommerceFormData {
  category: "ecommerce";
  campaignType: CampaignType;
  shopName: string;
  logo: string; // base64
  productImage: string; // base64
  postType: "product" | "sales" | "new-arrival";
  productName: string;
  features?: string;
  newPrice: string;
  oldPrice: string;
  colorSize?: string;
  availability: "in-stock" | "out-of-stock" | "preorder";
  shippingDuration?: string;
  purchaseLink?: string;
  whatsapp: string;
  cta: string;
  format: OutputFormat;
  brandKitId?: string;
}

export interface ServicesFormData {
  category: "services";
  campaignType: CampaignType;
  businessName: string;
  logo: string; // base64
  serviceImage: string; // base64
  serviceType: "maintenance" | "cleaning" | "travel" | "business" | "consulting";
  serviceName: string;
  serviceDetails?: string;
  price: string;
  priceType: "fixed" | "starting-from";
  executionTime?: string;
  coverageArea?: string;
  warranty?: string;
  quickFeatures?: string;
  offerDuration?: string;
  whatsapp: string;
  cta: string;
  format: OutputFormat;
  brandKitId?: string;
}

export interface FashionFormData {
  category: "fashion";
  campaignType: CampaignType;
  brandName: string;
  logo: string; // base64
  productImage: string; // base64
  postType: "product" | "discount" | "collection";
  itemName: string;
  description?: string;
  newPrice: string;
  oldPrice: string;
  availableSizes?: string;
  availableColors?: string;
  offerNote?: string;
  offerDuration?: string;
  whatsapp: string;
  cta: string;
  format: OutputFormat;
  brandKitId?: string;
}

export interface BeautyFormData {
  category: "beauty";
  campaignType: CampaignType;
  salonName: string;
  logo: string; // base64
  serviceImage: string; // base64
  postType: "salon-service" | "spa-session" | "beauty-product";
  serviceName: string;
  benefit?: string;
  newPrice: string;
  oldPrice: string;
  sessionDuration?: string;
  suitableFor?: string;
  bookingCondition: "advance" | "available-now";
  offerDuration?: string;
  whatsapp: string;
  cta: string;
  format: OutputFormat;
  brandKitId?: string;
}

export type PostFormData =
  | RestaurantFormData
  | SupermarketFormData
  | EcommerceFormData
  | ServicesFormData
  | FashionFormData
  | BeautyFormData;

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
  | "ramadan"
  | "eid"
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

// ── Poster V2 (HTML-to-Image) ─────────────────────────────────────
export type PosterGenStep =
  | "idle"
  | "generating-designs"
  | "complete"
  | "error";

export interface PosterResult {
  designIndex: number;
  format: OutputFormat;
  html: string;
  imageBase64?: string;
  status: "complete" | "error";
  error?: string;
  designName: string;
  designNameAr: string;
  isGift?: boolean;
}

// ── Reel Generation ─────────────────────────────────────────────
export type ReelGenStatus =
  | "pending"
  | "generating_spec"
  | "rendering"
  | "uploading"
  | "complete"
  | "error";

export interface ReelGeneration {
  id: string;
  generationId?: string;
  sourceImageUrl: string;
  status: ReelGenStatus;
  videoUrl?: string;
  thumbnailUrl?: string;
  progress?: number; // 0-1 for rendering phase
  error?: string;
  createdAt: number;
}

export type GiftEditorFontFamily = "noto-kufi";

export interface GiftEditorTextLayer {
  content: string;
  color: string;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700 | 800;
  fontFamily: GiftEditorFontFamily;
  x: number; // 0..1 relative to canvas width
  y: number; // 0..1 relative to canvas height
}

export interface GiftEditorOverlayLayer {
  imageBase64: string | null;
  x: number; // 0..1 relative to canvas width
  y: number; // 0..1 relative to canvas height
  scale: number;
  borderRadius: number;
}

export interface GiftEditorState {
  texts: GiftEditorTextLayer[];
  overlays: GiftEditorOverlayLayer[];
}

export interface GeneratePostersResult {
  main: PosterResult;
  gift?: PosterResult;
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
  canCreateReels: boolean;
}

// ── Admin API Contracts ─────────────────────────────────────────────
// Convex function names and response shapes for Agent B (frontend)
//
// Queries:
//   admin.getAiOverview        → AdminAiOverview
//   admin.getFinancialOverview → AdminFinancialOverview
//   admin.listUsers            → AdminUser[]
//   admin.listSubscriptions    → AdminSubscriptionsResult
//   admin.listFeedback         → AdminFeedbackItem[]
//   admin.getFeedbackSummary   → AdminFeedbackSummary
//   admin.listSupportTickets   → AdminSupportTicket[]
//   admin.getSupportTicketThread → AdminSupportThread
//   admin.getDailyUsage        → AdminDailyUsageRow[]
//
// Mutations:
//   admin.submitFeedback       → (rating, comment?, model?, category?, generationId?)
//   admin.createSupportTicket  → (subject, body, priority?)
//   admin.replySupportTicket   → (ticketId, body, newStatus?)
//   admin.updateTicketStatus   → (ticketId, status)
//   admin.assignTicket         → (ticketId, assignedTo)

export interface AdminAiOverview {
  periodDays: number;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  totalCostUsd: number;
  totalImages: number;
  byModel: Record<string, {
    count: number;
    cost: number;
    images: number;
    avgDurationMs: number;
    totalDuration: number;
  }>;
}

export interface AdminFinancialOverview {
  periodDays: number;
  grossRevenue: number;
  stripeFees: number;
  hasActualFees: boolean;
  apiCostUsd: number;
  netProfit: number;
  activeSubscriptions: number;
  subscriptionsByPlan: {
    starter: number;
    growth: number;
    dominant: number;
  };
  mrr: number;
}

export interface AdminUser {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "member";
  createdAt: number;
  billing: {
    planKey: string;
    status: string;
    monthlyCreditsUsed: number;
    monthlyCreditLimit: number;
    addonCreditsBalance: number;
  } | null;
  totalGenerations: number;
  totalCostUsd: number;
}

export interface AdminSubscriptionsResult {
  subscriptions: Array<{
    _id: string;
    clerkUserId: string;
    planKey: string;
    status: string;
    monthlyCreditLimit: number;
    monthlyCreditsUsed: number;
    addonCreditsBalance: number;
    currentPeriodStart?: number;
    currentPeriodEnd?: number;
    userName: string;
    userEmail: string;
  }>;
  summary: {
    total: number;
    active: number;
    trialing: number;
    pastDue: number;
    canceled: number;
  };
}

export interface AdminFeedbackItem {
  _id: string;
  clerkUserId: string;
  rating: "like" | "dislike";
  comment?: string;
  model?: string;
  category?: Category;
  createdAt: number;
  userName: string;
  userEmail: string;
}

export interface AdminFeedbackSummary {
  total: number;
  likes: number;
  dislikes: number;
  likeRate: number;
}

export interface AdminSupportTicket {
  _id: string;
  clerkUserId: string;
  subject: string;
  status: "open" | "in_progress" | "waiting_on_customer" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  createdAt: number;
  updatedAt: number;
  userName: string;
  userEmail: string;
  messageCount: number;
  lastMessageAt: number;
}

export interface AdminSupportThread {
  ticket: AdminSupportTicket;
  messages: Array<{
    _id: string;
    ticketId: string;
    senderClerkUserId: string;
    isAdmin: boolean;
    body: string;
    createdAt: number;
  }>;
}

export interface AdminDailyUsageRow {
  date: string;
  requests: number;
  cost: number;
  images: number;
  failures: number;
}

// ── User Business Profile (onboarding) ────────────────────────────
export interface UserBusinessProfile {
  businessName: string;
  businessCategory: Category;
  brandColors: string[];
  logoStorageId?: string;
  logoUrl?: string;
}

// ── Showcase Images (landing page carousel) ───────────────────────
export interface ShowcaseImage {
  _id: string;
  storageId: string;
  url?: string;
  title?: string;
  category: Category;
  order: number;
}
