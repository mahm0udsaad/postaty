"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Clock,
  Lightbulb,
  Loader2,
  RefreshCw,
  Megaphone,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ThumbsUp,
  Share2,
  Music,
  Wand2,
  Sparkles,
} from "lucide-react";
import type {
  MarketingContentHub as MarketingContentHubType,
  SocialPlatform,
  PlatformContent,
  MarketingContentStatus,
} from "@/lib/types";
import { useLocale } from "@/hooks/use-locale";

// ── Platform Configuration ─────────────────────────────────────────

const PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "whatsapp", "tiktok"];

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

const PLATFORM_CONFIG: Record<SocialPlatform, {
  name: { ar: string; en: string };
  icon: React.FC<{ className?: string }>;
  gradient: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  facebook: {
    name: { ar: "فيسبوك", en: "Facebook" },
    icon: FacebookIcon,
    gradient: "from-[#1877F2] to-[#0C5DC7]",
    bgColor: "bg-[#1877F2]/10",
    textColor: "text-[#1877F2]",
    borderColor: "border-[#1877F2]/20",
  },
  instagram: {
    name: { ar: "انستقرام", en: "Instagram" },
    icon: InstagramIcon,
    gradient: "from-[#E1306C] via-[#C13584] to-[#833AB4]",
    bgColor: "bg-[#E1306C]/10",
    textColor: "text-[#E1306C]",
    borderColor: "border-[#E1306C]/20",
  },
  whatsapp: {
    name: { ar: "واتساب", en: "WhatsApp" },
    icon: WhatsAppIcon,
    gradient: "from-[#25D366] to-[#128C7E]",
    bgColor: "bg-[#25D366]/10",
    textColor: "text-[#25D366]",
    borderColor: "border-[#25D366]/20",
  },
  tiktok: {
    name: { ar: "تيك توك", en: "TikTok" },
    icon: TikTokIcon,
    gradient: "from-[#010101] via-[#EE1D52] to-[#69C9D0]",
    bgColor: "bg-[#010101]/10 dark:bg-white/10",
    textColor: "text-[#010101] dark:text-white",
    borderColor: "border-[#010101]/20 dark:border-white/20",
  },
};

// ── RTL Detection Helper ──────────────────────────────────────────

const RTL_LANGUAGES = ["ar", "he", "fa", "ur"];
const RTL_CHAR_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function isRtlLanguage(language: string, sampleText?: string): boolean {
  if (RTL_LANGUAGES.includes(language)) return true;
  if (language === "auto" && sampleText) return RTL_CHAR_RE.test(sampleText);
  return false;
}

// ── Main Component ─────────────────────────────────────────────────

interface MarketingContentHubProps {
  content: MarketingContentHubType | null;
  status: MarketingContentStatus;
  posterImageBase64?: string;
  businessName?: string;
  onGenerate: () => void;
  onLanguageToggle: (lang: string) => void;
  onRetry: () => void;
  error?: string;
}

export function MarketingContentHub({
  content,
  status,
  posterImageBase64,
  businessName = "Business",
  onGenerate,
  onLanguageToggle,
  onRetry,
  error,
}: MarketingContentHubProps) {
  const { t } = useLocale();

  return (
    <motion.div
      id="marketing-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-6 scroll-mt-24"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2 px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
            <Megaphone size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h3 className="text-2xl font-black text-foreground">
                {t("المحتوى التسويقي", "Marketing Content")}
              </h3>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-primary to-accent text-white uppercase tracking-widest shadow-sm">
                AI
              </span>
            </div>
            <p className="text-sm font-medium text-muted">
              {t("نصوص وهاشتاقات محسنة لكل منصة تواصل اجتماعي", "Optimized texts and hashtags for each social media platform")}
            </p>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="mt-2 sm:mt-0">
          <LanguageToggle
            language={content?.language ?? "auto"}
            onToggle={onLanguageToggle}
            disabled={status === "loading"}
          />
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
          >
            {PLATFORMS.map((platform) => (
              <PlatformCardSkeleton key={platform} platform={platform} />
            ))}
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 bg-danger/5 rounded-3xl border border-danger/20 mt-6"
          >
            <div className="p-4 bg-danger/10 rounded-full text-danger mb-2">
              <RefreshCw size={32} />
            </div>
            <h4 className="text-lg font-bold text-foreground">
              {t("عذراً، حدث خطأ", "Sorry, an error occurred")}
            </h4>
            <p className="text-muted text-sm max-w-md">
              {error || t("فشل إنشاء المحتوى التسويقي", "Failed to generate marketing content")}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 flex items-center gap-2 px-6 py-3 bg-danger text-white rounded-xl font-bold hover:bg-danger/90 transition-colors shadow-lg shadow-danger/20 active:scale-95"
            >
              <RefreshCw size={18} />
              {t("إعادة المحاولة", "Try again")}
            </button>
          </motion.div>
        )}

        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden bg-surface-1 border border-card-border rounded-3xl shadow-sm group mt-6"
          >
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3" />

            <div className="flex flex-col md:flex-row items-stretch">
              
              {/* Left Side: Content */}
              <div className="flex-1 p-8 md:p-12 z-10 flex flex-col justify-center text-center md:text-start">
                <div className="inline-flex items-center justify-center p-3.5 bg-surface-2 rounded-2xl mb-6 shadow-sm border border-card-border group-hover:scale-110 transition-transform duration-500 self-center md:self-start">
                  <Wand2 size={28} className="text-primary" />
                </div>
                
                <h4 className="text-2xl md:text-3xl font-black text-foreground mb-4 leading-tight">
                  {t("جاهز للنشر؟ دع الذكاء الاصطناعي يكتب لك", "Ready to post? Let AI write for you")}
                </h4>
                
                <p className="text-base text-muted mb-8 leading-relaxed font-medium max-w-lg mx-auto md:mx-0">
                  {t(
                    "احصل على نصوص جذابة، هاشتاقات متصدرة، وأفضل أوقات النشر المخصصة لـ انستقرام، تيك توك، فيسبوك، وواتساب بضغطة زر واحدة.",
                    "Get engaging texts, trending hashtags, and best posting times optimized for Instagram, TikTok, Facebook, and WhatsApp with just one click."
                  )}
                </p>
                
                <button
                  type="button"
                  onClick={onGenerate}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-[0.98] text-lg w-full sm:w-auto self-center md:self-start"
                >
                  <Sparkles size={22} />
                  {t("توليد المحتوى بذكاء", "Generate Content Smartly")}
                </button>
              </div>

              {/* Right Side: Visuals */}
              <div className="w-full md:w-2/5 min-h-[320px] relative flex items-center justify-center p-8 bg-surface-2/30 border-t md:border-t-0 md:border-r border-card-border/50 overflow-hidden">
                <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
                  {/* Central glowing orb */}
                  <div className="absolute inset-0 m-auto w-32 h-32 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />
                  
                  {/* Abstract connection lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 dark:opacity-40" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" className="origin-center animate-[spin_20s_linear_infinite]" />
                  </svg>

                  {/* Center Node */}
                  <div className="relative w-20 h-20 bg-surface-1 rounded-2xl shadow-2xl border border-card-border flex items-center justify-center z-20 group-hover:scale-105 transition-transform duration-500">
                    <Sparkles size={32} className="text-primary" />
                  </div>

                  {/* Orbiting Platform Icons */}
                  <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-14 h-14 bg-white dark:bg-black rounded-2xl shadow-xl border border-black/5 dark:border-white/5 flex items-center justify-center z-10 group-hover:-translate-y-3 transition-transform duration-500">
                    <InstagramIcon className="w-8 h-8 text-[#E1306C]" />
                  </div>
                  <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-14 h-14 bg-black rounded-2xl shadow-xl border border-white/10 flex items-center justify-center z-10 group-hover:translate-y-3 transition-transform duration-500">
                    <TikTokIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute top-1/2 left-[10%] -translate-y-1/2 w-14 h-14 bg-[#1877F2] rounded-2xl shadow-xl border border-black/5 dark:border-white/5 flex items-center justify-center z-10 group-hover:-translate-x-3 transition-transform duration-500">
                    <FacebookIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-14 h-14 bg-[#25D366] rounded-2xl shadow-xl border border-black/5 dark:border-white/5 flex items-center justify-center z-10 group-hover:translate-x-3 transition-transform duration-500">
                    <WhatsAppIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {status === "complete" && content && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
          >
            {PLATFORMS.map((platform, i) => (
              <motion.div
                key={platform}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <PlatformCard
                  platformContent={content.contents[platform]}
                  platform={platform}
                  posterImageBase64={posterImageBase64}
                  businessName={businessName}
                  isRtl={isRtlLanguage(content.language, content.contents[platform].caption)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Language Toggle ────────────────────────────────────────────────

function LanguageToggle({
  language,
  onToggle,
  disabled,
}: {
  language: string;
  onToggle: (lang: string) => void;
  disabled: boolean;
}) {
  const { t } = useLocale();
  const options: { value: string; label: string }[] = [
    { value: "auto", label: t("تلقائي", "Auto") },
    { value: "ar", label: "عربي" },
    { value: "en", label: "English" },
  ];

  return (
    <div className="flex items-center p-1 bg-surface-2/50 backdrop-blur-sm rounded-xl border border-card-border/50">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onToggle(opt.value)}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
            language === opt.value
              ? "bg-surface-1 text-foreground shadow-sm border border-card-border"
              : "text-muted hover:text-foreground hover:bg-surface-2/50 border border-transparent"
          } disabled:opacity-50`}
        >
          {opt.label}
        </button>
      ))}
      {disabled && <Loader2 size={16} className="animate-spin text-primary ml-2 mr-2" />}
    </div>
  );
}

// ── Profile Avatar ─────────────────────────────────────────────────

function ProfileAvatar({ name, size = "sm", className = "" }: { name: string; size?: "sm" | "md"; className?: string }) {
  const initial = name.charAt(0).toUpperCase();
  const sizeClasses = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center font-bold text-white shrink-0 ${className}`}>
      {initial}
    </div>
  );
}

// ── Platform Card (Router) ─────────────────────────────────────────

function PlatformCard({
  platformContent,
  platform,
  posterImageBase64,
  businessName,
  isRtl,
}: {
  platformContent: PlatformContent;
  platform: SocialPlatform;
  posterImageBase64?: string;
  businessName: string;
  isRtl: boolean;
}) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;

  const handleCopy = async () => {
    const fullText = platformContent.caption +
      (platformContent.hashtags.length > 0
        ? "\n\n" + platformContent.hashtags.join(" ")
        : "");
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mockupProps = { posterImageBase64, businessName, isRtl, content: platformContent };

  return (
    <div
      className="relative rounded-2xl border border-card-border bg-surface-1 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Platform Badge */}
      <div className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm border border-black/10 dark:border-white/10 shadow-sm`}>
        <Icon className={`w-3.5 h-3.5 ${config.textColor}`} />
        <span className="text-[11px] font-bold text-foreground/80">
          {config.name[isRtl ? "ar" : "en"]}
        </span>
      </div>

      {/* Platform Mockup */}
      {platform === "facebook" && <FacebookMockup {...mockupProps} />}
      {platform === "instagram" && <InstagramMockup {...mockupProps} />}
      {platform === "whatsapp" && <WhatsAppMockup {...mockupProps} />}
      {platform === "tiktok" && <TikTokMockup {...mockupProps} />}

      {/* Content Section (shared across all platforms) */}
      <div className="p-4 flex-1 flex flex-col gap-4 border-t border-card-border/50">
        
        <div className="flex-1 space-y-3">
          {/* Caption */}
          <p className="text-[14px] text-foreground/90 leading-relaxed whitespace-pre-line">
            {platformContent.caption}
          </p>

          {/* Hashtags */}
          {platformContent.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5" dir="ltr">
              {platformContent.hashtags.map((tag, i) => (
                <span
                  key={i}
                  className={`inline-block px-2 py-0.5 rounded-md text-[13px] font-medium ${config.bgColor} ${config.textColor}`}
                >
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2 border-t border-card-border/50">
          {/* Best Posting Time */}
          <div className={`flex items-start gap-3 p-3 rounded-xl ${config.bgColor}`}>
            <Clock size={16} className={`${config.textColor} shrink-0 mt-0.5`} />
            <div className="space-y-0.5">
              <p className={`text-[13px] font-bold ${config.textColor}`}>
                {platformContent.bestPostingTime}
              </p>
              <p className="text-[12px] text-foreground/70 leading-snug">
                {platformContent.bestPostingTimeReason}
              </p>
            </div>
          </div>

          {/* Content Tip */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-foreground/70 leading-snug">
              {platformContent.contentTip}
            </p>
          </div>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold transition-all mt-auto ${
            copied
              ? "bg-success/10 text-success"
              : `${config.bgColor} ${config.textColor} hover:brightness-95 dark:hover:brightness-110 active:scale-[0.98]`
          }`}
        >
          {copied ? (
            <>
              <Check size={16} />
              {t("تم نسخ المحتوى", "Content Copied")}
            </>
          ) : (
            <>
              <Copy size={16} />
              {t("نسخ المحتوى", "Copy Content")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Facebook Mockup ────────────────────────────────────────────────

function FacebookMockup({
  posterImageBase64,
  businessName,
  content,
  isRtl,
}: {
  posterImageBase64?: string;
  businessName: string;
  content: PlatformContent;
  isRtl: boolean;
}) {
  return (
    <div className="bg-white dark:bg-[#242526]" dir={isRtl ? "rtl" : "ltr"}>
      {/* Post Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <ProfileAvatar name={businessName} />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[#050505] dark:text-[#E4E6EB] leading-tight truncate">
            {businessName}
          </p>
          <div className="flex items-center gap-1 text-[12px] text-[#65676B] dark:text-[#B0B3B8]">
            <span>2h</span>
            <span>·</span>
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zM5.3 9.7l2.2-2.2L9.7 9.7l1.1-1.1L8.5 6.3l-.8-.8-.8.8L4.2 8.6l1.1 1.1z" />
            </svg>
          </div>
        </div>
        <MoreHorizontal size={20} className="text-[#65676B] dark:text-[#B0B3B8]" />
      </div>

      {/* Post Text */}
      <div className="px-4 pb-3">
        <p className="text-[14px] text-[#050505] dark:text-[#E4E6EB] whitespace-pre-wrap break-words">
          {content.caption}
          {content.hashtags.length > 0 && (
            <span className="block mt-2 text-[#1877F2]">
              {content.hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
            </span>
          )}
        </p>
      </div>

      {/* Post Image */}
      {posterImageBase64 && (
        <div className="w-full" style={{ aspectRatio: "4/5", maxHeight: "400px" }}>
          <img
            src={posterImageBase64}
            alt="Facebook post preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Reactions Bar */}
      <div className="px-4 pt-2 pb-2">
        <div className="flex items-center justify-between text-[13px] text-[#65676B] dark:text-[#B0B3B8]">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              <span className="w-5 h-5 rounded-full bg-[#1877F2] border-2 border-white dark:border-[#242526] flex items-center justify-center text-[10px]">👍</span>
              <span className="w-5 h-5 rounded-full bg-[#F33E58] border-2 border-white dark:border-[#242526] flex items-center justify-center text-[10px]">❤️</span>
            </div>
            <span>128</span>
          </div>
          <span>12 comments · 4 shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mx-4 py-1 border-t border-[#CED0D4] dark:border-[#3E4042] flex items-center justify-between">
        <button type="button" className="flex-1 flex items-center justify-center gap-2 py-1.5 text-[14px] font-semibold text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] rounded-md transition-colors">
          <ThumbsUp size={18} />
          <span>Like</span>
        </button>
        <button type="button" className="flex-1 flex items-center justify-center gap-2 py-1.5 text-[14px] font-semibold text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] rounded-md transition-colors">
          <MessageCircle size={18} />
          <span>Comment</span>
        </button>
        <button type="button" className="flex-1 flex items-center justify-center gap-2 py-1.5 text-[14px] font-semibold text-[#65676B] dark:text-[#B0B3B8] hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] rounded-md transition-colors">
          <Share2 size={18} />
          <span>Share</span>
        </button>
      </div>
      <div className="h-2" />
    </div>
  );
}

// ── Instagram Mockup ───────────────────────────────────────────────

function InstagramMockup({
  posterImageBase64,
  businessName,
  content,
  isRtl,
}: {
  posterImageBase64?: string;
  businessName: string;
  content: PlatformContent;
  isRtl: boolean;
}) {
  return (
    <div className="bg-white dark:bg-[#000000]" dir={isRtl ? "rtl" : "ltr"}>
      {/* Post Header */}
      <div className="flex items-center gap-3 px-3 py-3">
        <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#FFD600] via-[#FF0169] to-[#D300C5]">
          <div className="bg-white dark:bg-black rounded-full p-[2px]">
            <ProfileAvatar name={businessName} size="md" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[#262626] dark:text-[#F5F5F5] leading-tight truncate">
            {businessName.toLowerCase().replace(/\s+/g, "_")}
          </p>
        </div>
        <MoreHorizontal size={20} className="text-[#262626] dark:text-[#F5F5F5]" />
      </div>

      {/* Post Image (4:5 optimal for IG now) */}
      {posterImageBase64 && (
        <div className="w-full" style={{ aspectRatio: "4/5", maxHeight: "450px" }}>
          <img
            src={posterImageBase64}
            alt="Instagram post preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Action Icons */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-4">
          <Heart size={24} className="text-[#262626] dark:text-[#F5F5F5]" />
          <MessageCircle size={24} className="text-[#262626] dark:text-[#F5F5F5] scale-x-[-1]" />
          <Send size={24} className="text-[#262626] dark:text-[#F5F5F5] -rotate-12" />
        </div>
        <Bookmark size={24} className="text-[#262626] dark:text-[#F5F5F5]" />
      </div>

      {/* Likes */}
      <div className="px-3 pb-1">
        <p className="text-[14px] font-semibold text-[#262626] dark:text-[#F5F5F5]">
          342 likes
        </p>
      </div>
      
      {/* Caption */}
      <div className="px-3 pb-3">
        <p className="text-[14px] text-[#262626] dark:text-[#F5F5F5] whitespace-pre-wrap break-words">
          <span className="font-semibold mr-1">{businessName.toLowerCase().replace(/\s+/g, "_")}</span>
          {content.caption}
          {content.hashtags.length > 0 && (
            <span className="block mt-1 text-[#00376B] dark:text-[#E0F1FF]">
              {content.hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
            </span>
          )}
        </p>
        <p className="text-[12px] text-[#8E8E8E] mt-1 uppercase">2 hours ago</p>
      </div>
    </div>
  );
}

// ── WhatsApp Mockup ────────────────────────────────────────────────

function WhatsAppMockup({
  posterImageBase64,
  businessName,
  content,
  isRtl,
}: {
  posterImageBase64?: string;
  businessName: string;
  content: PlatformContent;
  isRtl: boolean;
}) {
  return (
    <div
      className="relative px-3 pt-4 pb-3 flex flex-col h-[500px]"
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        backgroundColor: "#EFEAE2",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8bfb0' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* WhatsApp Header Bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center gap-3 bg-[#008069] px-4 py-2 z-10 shadow-sm">
        <div className="flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <ProfileAvatar name={businessName} size="sm" className="!w-9 !h-9" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-white truncate">{businessName}</p>
        </div>
        <div className="flex gap-4 text-white">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" /><path d="M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          <MoreHorizontal className="w-5 h-5" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-12 mb-2 scrollbar-hide">
        {/* Message Bubble */}
        <div className="flex justify-end my-2">
          <div className="relative max-w-[85%] bg-[#D9FDD3] dark:bg-[#005C4B] rounded-lg rounded-tr-none shadow-sm flex flex-col">
            {/* Bubble tail */}
            <div className="absolute -top-0 -right-[8px] w-4 h-4 overflow-hidden">
              <div className="w-4 h-4 bg-[#D9FDD3] dark:bg-[#005C4B] rotate-45 translate-x-[-8px] translate-y-[4px]" />
            </div>

            {/* Image in bubble */}
            {posterImageBase64 && (
              <div className="m-1 rounded-md overflow-hidden bg-black/5" style={{ minHeight: "200px" }}>
                <img
                  src={posterImageBase64}
                  alt="WhatsApp message preview"
                  className="w-full object-cover"
                  style={{ maxHeight: "350px" }}
                />
              </div>
            )}
            
            {/* Caption in bubble */}
            <div className="px-2 pt-1 pb-1 text-[14.5px] text-[#111B21] dark:text-[#E9EDEF] whitespace-pre-wrap break-words leading-relaxed">
              {content.caption}
              {content.hashtags.length > 0 && (
                <span className="block mt-1 text-[#027EB5] dark:text-[#53BDEB]">
                  {content.hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
                </span>
              )}
            </div>

            {/* Message footer */}
            <div className="flex items-center justify-end gap-1 px-2 pb-1.5 pt-0.5 mt-auto">
              <span className="text-[11px] text-[#667781] dark:text-white/60">12:30 PM</span>
              {/* Double blue tick */}
              <svg viewBox="0 0 16 11" className="w-[18px] h-[12px] text-[#53BDEB]" fill="currentColor">
                <path d="M11.071.653a.457.457 0 00-.304-.102.493.493 0 00-.381.178l-6.19 7.44-2.862-2.69a.493.493 0 00-.381-.178.457.457 0 00-.304.102.435.435 0 00-.178.381c0 .127.051.254.178.381l3.117 2.944a.493.493 0 00.685-.051l6.571-7.898a.39.39 0 00.102-.305.435.435 0 00-.153-.202zm-2.513 7.44l.685.639a.493.493 0 00.685-.051l6.571-7.898a.39.39 0 00.102-.305.435.435 0 00-.153-.203.457.457 0 00-.304-.102.493.493 0 00-.381.178L9.24 8.04l-.685-.639z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 mt-auto z-10">
        <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-full px-4 py-3 flex items-center shadow-sm">
          <span className="text-[15px] text-[#8696A0] dark:text-[#8696A0]">Message</span>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#00A884] flex items-center justify-center shrink-0 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.239 1.816-13.239 1.817-.011 7.912z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── TikTok Mockup ──────────────────────────────────────────────────

function TikTokMockup({
  posterImageBase64,
  businessName,
  content,
  isRtl,
}: {
  posterImageBase64?: string;
  businessName: string;
  content: PlatformContent;
  isRtl: boolean;
}) {
  return (
    <div className="relative bg-black overflow-hidden" dir={isRtl ? "rtl" : "ltr"} style={{ aspectRatio: "9/16", maxHeight: "550px" }}>
      {/* Background Image */}
      {posterImageBase64 && (
        <>
          <img
            src={posterImageBase64}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110"
          />
          <img
            src={posterImageBase64}
            alt="TikTok post preview"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </>
      )}

      {/* Dark gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent h-24" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent mt-auto h-1/2 pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <div className="flex gap-4">
          <span className="text-white/60 text-[16px] font-semibold">Following</span>
          <span className="text-white text-[16px] font-bold border-b-2 border-white pb-1">For You</span>
        </div>
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
        </svg>
      </div>

      {/* Right sidebar actions */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
        {/* Profile */}
        <div className="relative">
          <ProfileAvatar name={businessName} size="md" className="!w-12 !h-12 border-2 border-white" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#FE2C55] flex items-center justify-center border-2 border-black">
            <span className="text-white text-[14px] font-bold leading-none mb-0.5">+</span>
          </div>
        </div>
        {/* Heart */}
        <div className="flex flex-col items-center mt-2">
          <Heart size={32} className="text-white drop-shadow-md" fill="white" />
          <span className="text-white text-[12px] font-semibold mt-1 drop-shadow-md">42.8K</span>
        </div>
        {/* Comment */}
        <div className="flex flex-col items-center">
          <MessageCircle size={32} className="text-white drop-shadow-md" fill="white" />
          <span className="text-white text-[12px] font-semibold mt-1 drop-shadow-md">1,286</span>
        </div>
        {/* Bookmark */}
        <div className="flex flex-col items-center">
          <Bookmark size={32} className="text-white drop-shadow-md" fill="white" />
          <span className="text-white text-[12px] font-semibold mt-1 drop-shadow-md">8,452</span>
        </div>
        {/* Share */}
        <div className="flex flex-col items-center">
          <Share2 size={32} className="text-white drop-shadow-md" />
          <span className="text-white text-[12px] font-semibold mt-1 drop-shadow-md">10.1K</span>
        </div>
        {/* Music disc */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-[8px] border-black flex items-center justify-center animate-spin mt-2" style={{ animationDuration: "3s" }}>
          <Music size={12} className="text-white" />
        </div>
      </div>

      {/* Bottom text */}
      <div className="absolute bottom-4 left-3 right-16 space-y-2">
        <p className="text-white text-[15px] font-bold drop-shadow-md">
          @{businessName.toLowerCase().replace(/\s+/g, "_")}
        </p>
        <div className="text-white text-[14px] drop-shadow-md line-clamp-2 leading-tight">
          {content.caption}
        </div>
        <div className="flex flex-wrap gap-1">
          {content.hashtags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-white font-bold text-[14px] drop-shadow-md">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Music size={14} className="text-white shrink-0 drop-shadow-md" />
          <div className="overflow-hidden">
            <p className="text-white text-[13px] whitespace-nowrap animate-marquee drop-shadow-md">
              Original Sound - {businessName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Card ──────────────────────────────────────────────────

function PlatformCardSkeleton({ platform }: { platform: SocialPlatform }) {
  return (
    <div className="rounded-2xl border border-card-border bg-surface-1 overflow-hidden shadow-sm flex flex-col">
      {/* Mockup Area Skeleton */}
      {platform === "whatsapp" && (
        <div className="relative bg-[#EFEAE2] flex flex-col h-[500px]">
          <div className="absolute top-0 left-0 right-0 bg-[#008069] px-4 py-2 flex items-center gap-3 z-10">
            <div className="w-9 h-9 bg-white/30 rounded-full animate-pulse" />
            <div className="h-4 w-32 bg-white/30 rounded animate-pulse" />
          </div>
          <div className="flex-1 overflow-y-auto mt-12 mb-2 p-3 flex flex-col justify-end">
            <div className="flex justify-end">
              <div className="w-[85%] bg-[#D9FDD3] dark:bg-[#005C4B] rounded-lg rounded-tr-none p-2 h-[250px] animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-auto p-2 bg-[#EFEAE2] z-10">
            <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-full px-4 py-3 h-12 shadow-sm animate-pulse" />
            <div className="w-12 h-12 rounded-full bg-[#00A884] shrink-0 shadow-sm animate-pulse" />
          </div>
        </div>
      )}

      {platform === "tiktok" && (
        <div className="bg-black relative overflow-hidden" style={{ aspectRatio: "9/16", maxHeight: "550px" }}>
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
          <div className="absolute bottom-4 left-3 right-16 space-y-3">
            <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-4/5 bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-3 w-16 bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="absolute right-3 bottom-20 flex flex-col gap-6">
            <div className="w-12 h-12 rounded-full bg-gray-700 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-700 mx-auto animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-700 mx-auto animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-700 mx-auto animate-pulse" />
          </div>
        </div>
      )}

      {(platform === "facebook" || platform === "instagram") && (
        <div className={`${platform === "instagram" ? "bg-white dark:bg-black" : "bg-white dark:bg-[#242526]"}`}>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              {platform === "facebook" && <div className="h-2 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />}
            </div>
          </div>
          <div
            className="bg-gray-200 dark:bg-gray-800 animate-pulse"
            style={{
              aspectRatio: "4/5",
              maxHeight: platform === "instagram" ? "450px" : "400px",
            }}
          />
          <div className="px-4 py-3 flex gap-4">
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {/* Content Section Skeleton (Shared) */}
      <div className="px-4 pt-4 pb-5 space-y-4 bg-surface-1 border-t border-card-border mt-auto">
        <div className="space-y-2.5">
          <div className="h-3.5 bg-surface-2 rounded-md w-full animate-pulse" />
          <div className="h-3.5 bg-surface-2 rounded-md w-[90%] animate-pulse" />
          <div className="h-3.5 bg-surface-2 rounded-md w-[60%] animate-pulse" />
        </div>
        
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-surface-2 rounded-md animate-pulse" />
          <div className="h-6 w-20 bg-surface-2 rounded-md animate-pulse" />
          <div className="h-6 w-14 bg-surface-2 rounded-md animate-pulse" />
        </div>
        
        <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-2/50 animate-pulse">
          <div className="w-5 h-5 rounded bg-surface-2 shrink-0" />
          <div className="space-y-2 w-full">
            <div className="h-3 w-32 bg-surface-2 rounded" />
            <div className="h-3 w-48 bg-surface-2 rounded" />
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 animate-pulse">
          <div className="w-5 h-5 rounded bg-amber-500/20 shrink-0" />
          <div className="h-3 w-full bg-amber-500/20 rounded mt-1" />
        </div>
        
        <div className="h-[44px] bg-surface-2 rounded-xl animate-pulse mt-2" />
      </div>
    </div>
  );
}
