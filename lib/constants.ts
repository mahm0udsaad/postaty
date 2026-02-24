import type {
  Category,
  FormatConfig,
  OutputFormat,
  TemplateCategory,
  StyleAdjective,
  CampaignType,
  OrgPlan,
  PlanLimits,
} from "./types";

// ── Output Formats ─────────────────────────────────────────────────

export const FORMAT_CONFIGS: Record<OutputFormat, FormatConfig> = {
  "instagram-square": {
    label: "انستقرام مربع",
    aspectRatio: "1:1",
    width: 1080,
    height: 1080,
  },
  "instagram-story": {
    label: "انستقرام ستوري",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
  },
  "facebook-post": {
    label: "فيسبوك بوست",
    aspectRatio: "4:5",
    width: 1080,
    height: 1350,
  },
  "facebook-cover": {
    label: "غلاف فيسبوك",
    aspectRatio: "16:9",
    width: 1640,
    height: 924,
  },
  "twitter-post": {
    label: "تويتر / X",
    aspectRatio: "16:9",
    width: 1200,
    height: 675,
  },
  "whatsapp-status": {
    label: "حالة واتساب",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
  },
};

// Formats available per AI generation (aspect ratios the model supports)
export const AI_GENERATION_FORMATS: OutputFormat[] = [
  "instagram-square",
  "instagram-story",
  "facebook-post",
];

// All formats available for poster (HTML-to-image) generation
export const POSTER_GENERATION_FORMATS: OutputFormat[] = [
  "instagram-square",
  "instagram-story",
  "facebook-post",
  "facebook-cover",
  "twitter-post",
  "whatsapp-status",
];

// ── Category Labels ────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<Category, string> = {
  restaurant: "مطاعم وكافيهات",
  supermarket: "سوبر ماركت",
  ecommerce: "متاجر إلكترونية",
  services: "خدمات",
  fashion: "أزياء وموضة",
  beauty: "تجميل وعناية",
};

// ── Campaign Types ────────────────────────────────────────────────

export const CAMPAIGN_TYPE_OPTIONS: {
  value: CampaignType;
  label: string;
  description: string;
}[] = [
  {
    value: "standard",
    label: "عادي",
    description: "ستايل حديث عام",
  },
  {
    value: "ramadan",
    label: "رمضان",
    description: "لمسات روحانية هادئة",
  },
];

// ── CTA & Headline Options ─────────────────────────────────────────

export const RESTAURANT_CTA_OPTIONS = [
  "اطلب الان واستفيد من العرض",
  "اطلب قبل انتهاء العرض",
  "توصيل سريع",
] as const;

export const SUPERMARKET_HEADLINE_OPTIONS = [
  "وفر في مشترياتك اليومية",
  "عرض الاسبوع",
  "خصم على منتجاتك الأساسية",
] as const;

export const SUPERMARKET_CTA_OPTIONS = [
  "اطلب الان",
  "أضف للسلة عبر الواتساب",
  "العرض ساري اليوم",
] as const;

export const ONLINE_HEADLINE_OPTIONS = [
  "خصم حصري",
  "منتج مطلوب الان",
  "توصيل لجميع المناطق",
] as const;

export const ECOMMERCE_HEADLINE_OPTIONS = [
  "خصم حصري",
  "منتج مطلوب الان",
  "توصيل لجميع المناطق",
] as const;

export const ECOMMERCE_CTA_OPTIONS = [
  "اشترِ الآن",
  "تسوق الآن",
  "شاهد التفاصيل",
] as const;

export const SERVICES_CTA_OPTIONS = [
  "احجز الآن",
  "اطلب زيارة",
  "استشارة واتساب",
] as const;

export const FASHION_CTA_OPTIONS = [
  "اطلب الآن",
  "تسوق الآن",
  "راسلنا للمقاسات",
] as const;

export const BEAUTY_CTA_OPTIONS = [
  "احجزي الآن",
  "احجز الآن",
  "اطلب واتساب",
] as const;

// Legacy alias (online-form.tsx / template-form-online.tsx still use these)
export const ONLINE_CTA_OPTIONS = ECOMMERCE_CTA_OPTIONS;

// ── Template Categories ────────────────────────────────────────────

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, { en: string; ar: string }> = {
  sale: { en: "Sale", ar: "عروض" },
  new_arrival: { en: "New Arrival", ar: "وصل حديثاً" },
  minimal: { en: "Minimal", ar: "بسيط" },
  luxury: { en: "Luxury", ar: "فاخر" },
  ramadan: { en: "Ramadan", ar: "رمضان" },
  eid: { en: "Eid", ar: "العيد" },
  food: { en: "Food", ar: "طعام" },
  electronics: { en: "Electronics", ar: "الكترونيات" },
  fashion: { en: "Fashion", ar: "أزياء" },
  general: { en: "General", ar: "عام" },
};

// ── Style Adjectives ───────────────────────────────────────────────

export const STYLE_ADJECTIVE_OPTIONS: { value: StyleAdjective; label: string; labelAr: string }[] = [
  { value: "luxury", label: "Luxury", labelAr: "فاخر" },
  { value: "minimal", label: "Minimal", labelAr: "بسيط" },
  { value: "warm", label: "Warm", labelAr: "دافئ" },
  { value: "bold", label: "Bold", labelAr: "جريء" },
  { value: "playful", label: "Playful", labelAr: "مرح" },
  { value: "elegant", label: "Elegant", labelAr: "أنيق" },
  { value: "modern", label: "Modern", labelAr: "عصري" },
  { value: "traditional", label: "Traditional", labelAr: "تقليدي" },
  { value: "vibrant", label: "Vibrant", labelAr: "نابض بالحياة" },
  { value: "professional", label: "Professional", labelAr: "احترافي" },
  { value: "friendly", label: "Friendly", labelAr: "ودود" },
  { value: "premium", label: "Premium", labelAr: "متميز" },
];

// ── Plan Limits ────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<OrgPlan, PlanLimits> = {
  free: {
    creditsMonthly: 10,
    maxConcurrentGenerations: 1,
    maxBrandKits: 1,
    maxCustomTemplates: 0,
    exportFormats: ["instagram-square", "instagram-story"],
    hasWatermark: true,
    historyRetentionDays: 7,
    canCreateReels: false,
  },
  starter: {
    creditsMonthly: 100,
    maxConcurrentGenerations: 2,
    maxBrandKits: 3,
    maxCustomTemplates: 5,
    exportFormats: [
      "instagram-square",
      "instagram-story",
      "facebook-post",
      "facebook-cover",
      "twitter-post",
      "whatsapp-status",
    ],
    hasWatermark: false,
    historyRetentionDays: 30,
    canCreateReels: true,
  },
  pro: {
    creditsMonthly: 500,
    maxConcurrentGenerations: 5,
    maxBrandKits: 10,
    maxCustomTemplates: 999,
    exportFormats: [
      "instagram-square",
      "instagram-story",
      "facebook-post",
      "facebook-cover",
      "twitter-post",
      "whatsapp-status",
    ],
    hasWatermark: false,
    historyRetentionDays: -1, // unlimited
    canCreateReels: true,
  },
  agency: {
    creditsMonthly: 2000,
    maxConcurrentGenerations: 10,
    maxBrandKits: 50,
    maxCustomTemplates: 999,
    exportFormats: [
      "instagram-square",
      "instagram-story",
      "facebook-post",
      "facebook-cover",
      "twitter-post",
      "whatsapp-status",
    ],
    hasWatermark: false,
    historyRetentionDays: -1, // unlimited
    canCreateReels: true,
  },
};

// ── Reel Configuration ────────────────────────────────────────────

export const REEL_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationSeconds: { min: 8, max: 10 },
  creditsPerReel: 2,
  minPlanRequired: "starter" as OrgPlan,
  ttsModel: "eleven_multilingual_v2" as const,
} as const;

// ── Voiceover Voice Presets ──────────────────────────────────────

export interface VoicePreset {
  id: string;
  name: string;
  nameAr: string;
  language: "ar" | "en";
  gender: "male" | "female";
  accent: string;
  accentAr: string;
  country: string;       // ISO country code
  countryLabel: string;  // Arabic country name
  countryLabelEn: string;
}

export const VOICE_PRESETS: VoicePreset[] = [
  // ── Levantine (Jordan / Palestine) ──
  { id: "a1KZUXKFVFDOb33I1uqr", name: "Salma", nameAr: "سلمى", language: "ar", gender: "female", accent: "levantine", accentAr: "شامي", country: "JO", countryLabel: "الأردن", countryLabelEn: "Jordan" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", nameAr: "آدم", language: "ar", gender: "male", accent: "levantine", accentAr: "شامي", country: "JO", countryLabel: "الأردن", countryLabelEn: "Jordan" },
  { id: "qi4PkV9c01kb869Vh7Su", name: "Asmaa", nameAr: "أسماء", language: "ar", gender: "female", accent: "msa", accentAr: "فصحى", country: "PS", countryLabel: "فلسطين", countryLabelEn: "Palestine" },
  { id: "Qp2PG6sgef1EHtrNQKnf", name: "Mohamed", nameAr: "محمد", language: "ar", gender: "male", accent: "msa", accentAr: "فصحى", country: "PS", countryLabel: "فلسطين", countryLabelEn: "Palestine" },
  // ── Egyptian ──
  { id: "VMy40598IGgDeaOE8phq", name: "Fathy", nameAr: "فتحي", language: "ar", gender: "male", accent: "egyptian", accentAr: "مصري", country: "EG", countryLabel: "مصر", countryLabelEn: "Egypt" },
  { id: "meAbY2VpJkt1q46qk56T", name: "Hoda", nameAr: "هدى", language: "ar", gender: "female", accent: "egyptian", accentAr: "مصري", country: "EG", countryLabel: "مصر", countryLabelEn: "Egypt" },
  { id: "yrPIy5b3iLnVLIBfUSw8", name: "Amr", nameAr: "عمرو", language: "ar", gender: "male", accent: "egyptian", accentAr: "مصري", country: "EG", countryLabel: "مصر", countryLabelEn: "Egypt" },
  // ── Saudi / Gulf ──
  { id: "IK7YYZcSpmlkjKrQxbSn", name: "Raed", nameAr: "رائد", language: "ar", gender: "male", accent: "saudi", accentAr: "سعودي", country: "SA", countryLabel: "السعودية", countryLabelEn: "Saudi Arabia" },
  { id: "tavIIPLplRB883FzWU0V", name: "Mona", nameAr: "منى", language: "ar", gender: "female", accent: "msa", accentAr: "فصحى", country: "SA", countryLabel: "السعودية", countryLabelEn: "Saudi Arabia" },
  { id: "5Spsi3mCH9e7futpnGE5", name: "Fares", nameAr: "فارس", language: "ar", gender: "male", accent: "gulf", accentAr: "خليجي", country: "AE", countryLabel: "الإمارات", countryLabelEn: "UAE" },
  { id: "G1QUjBCuRBbLbAmYlTgl", name: "Abu Salem", nameAr: "أبو سالم", language: "ar", gender: "male", accent: "kuwaiti", accentAr: "كويتي", country: "KW", countryLabel: "الكويت", countryLabelEn: "Kuwait" },
  // ── English ──
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", nameAr: "راشيل", language: "en", gender: "female", accent: "american", accentAr: "أمريكي", country: "US", countryLabel: "أمريكا", countryLabelEn: "USA" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", nameAr: "دومي", language: "en", gender: "female", accent: "american", accentAr: "أمريكي", country: "US", countryLabel: "أمريكا", countryLabelEn: "USA" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", nameAr: "أرنولد", language: "en", gender: "male", accent: "american", accentAr: "أمريكي", country: "US", countryLabel: "أمريكا", countryLabelEn: "USA" },
];

// Unique countries for the voice filter UI
export const VOICE_COUNTRIES = [
  { code: "ALL", label: "الكل", labelEn: "All" },
  { code: "JO", label: "الأردن", labelEn: "Jordan" },
  { code: "PS", label: "فلسطين", labelEn: "Palestine" },
  { code: "EG", label: "مصر", labelEn: "Egypt" },
  { code: "SA", label: "السعودية", labelEn: "Saudi" },
  { code: "AE", label: "الإمارات", labelEn: "UAE" },
  { code: "KW", label: "الكويت", labelEn: "Kuwait" },
] as const;

// ── Default Negative Prompts ───────────────────────────────────────

export const DEFAULT_NEGATIVE_PROMPTS = [
  "no watermarks",
  "no stock photo badges",
  "no English text unless specified",
  "no low-resolution elements",
  "no clip art",
  "no cartoonish style",
  "no blurry images",
  "no distorted text",
] as const;
