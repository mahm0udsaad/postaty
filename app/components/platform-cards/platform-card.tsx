"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ThumbsUp,
  Share2,
  Repeat2,
  BarChart3,
} from "lucide-react";
import type { MarketingContent } from "@/lib/types";
import type { PlatformDef } from "./platform-config";
import { buildPlatformText } from "./platform-config";
import { PlatformIcon } from "./platform-icons";

// ── Platform Card ────────────────────────────────────────────────

export function PlatformCard({
  platform,
  content,
  posterImage,
  businessName,
  businessLogo,
  index,
  t,
}: {
  platform: PlatformDef;
  content: MarketingContent;
  posterImage?: string;
  businessName?: string;
  businessLogo?: string;
  index: number;
  t: (ar: string, en: string) => string;
}) {
  const [copied, setCopied] = useState(false);
  const fullText = buildPlatformText(platform.id, content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: "spring", damping: 20, stiffness: 200 }}
      className="rounded-2xl border border-card-border bg-surface-1 overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Platform header */}
      <div className={`flex items-center gap-2 px-3 py-2 ${platform.headerBg}`}>
        <span className={platform.headerText}><PlatformIcon id={platform.id} size={14} /></span>
        <span className={`text-xs font-bold ${platform.headerText}`}>{platform.name}</span>
      </div>

      {/* Platform-specific content */}
      <div className="flex-1 min-h-0">
        <PlatformContent platform={platform} content={content} posterImage={posterImage} businessName={businessName} businessLogo={businessLogo} t={t} />
      </div>

      {/* Copy button */}
      <div className="p-2 border-t border-card-border mt-auto">
        <button
          type="button"
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
            copied
              ? "bg-success/10 text-success border border-success/20"
              : "bg-primary/5 text-primary hover:bg-primary/10 border border-primary/10"
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? t("تم النسخ!", "Copied!") : t("نسخ النص", "Copy text")}
        </button>
      </div>
    </motion.div>
  );
}

// ── Platform-specific content renderers ──────────────────────────

interface ContentProps {
  content: MarketingContent;
  posterImage?: string;
  businessName?: string;
  businessLogo?: string;
  t?: (ar: string, en: string) => string;
}

function PlatformContent({
  platform,
  content,
  posterImage,
  businessName,
  businessLogo,
  t,
}: {
  platform: PlatformDef;
  content: MarketingContent;
  posterImage?: string;
  businessName?: string;
  businessLogo?: string;
  t: (ar: string, en: string) => string;
}) {
  const props: ContentProps = { content, posterImage, businessName, businessLogo, t };
  switch (platform.id) {
    case "instagram":
      return <InstagramContent {...props} />;
    case "facebook":
      return <FacebookContent {...props} />;
    case "tiktok":
      return <TikTokContent {...props} />;
    case "x":
      return <XContent {...props} />;
    case "whatsapp":
      return <WhatsAppContent {...props} />;
    case "snapchat":
      return <SnapchatContent {...props} />;
  }
}

// Reusable avatar: shows logo if available, otherwise first letter of business name
function BusinessAvatar({ logo, name, size = 28, className = "" }: { logo?: string; name?: string; size?: number; className?: string }) {
  if (logo) {
    return <img src={logo} alt="" className={`rounded-full object-cover ${className}`} style={{ width: size, height: size }} />;
  }
  const letter = name?.charAt(0) || "B";
  return (
    <div className={`rounded-full bg-foreground/10 flex items-center justify-center text-foreground/60 font-bold ${className}`} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {letter}
    </div>
  );
}

function toHandle(name?: string): string {
  if (!name) return "@business";
  return "@" + name.replace(/\s+/g, "_").replace(/[^\w\u0600-\u06FF]/g, "").toLowerCase();
}

function InstagramContent({ content, posterImage, businessName, businessLogo }: ContentProps) {
  return (
    <>
      <div className="flex items-center gap-2 px-3 pt-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-[2px]">
          <BusinessAvatar logo={businessLogo} name={businessName} size={24} className="border-2 border-surface-1" />
        </div>
        <span className="text-xs font-bold text-foreground truncate">{businessName || "business"}</span>
      </div>
      {posterImage && (
        <div className="mt-2">
          <img src={posterImage} alt="" className="w-full aspect-square object-cover" />
        </div>
      )}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3">
          <Heart size={18} className="text-foreground/70" />
          <MessageCircle size={18} className="text-foreground/70" />
          <Send size={18} className="text-foreground/70" />
        </div>
        <Bookmark size={18} className="text-foreground/70" />
      </div>
      <div className="px-3 pb-2" dir="rtl">
        <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">{content.caption}</p>
      </div>
      <div className="px-3 pb-3" dir="rtl">
        <p className="text-[10px] text-primary/60 line-clamp-2">{content.hashtags.map(h => `#${h}`).join(" ")}</p>
      </div>
    </>
  );
}

function FacebookContent({ content, posterImage, businessName, businessLogo, t }: ContentProps) {
  const tt = t!;
  return (
    <>
      <div className="flex items-center gap-2 px-3 pt-3">
        <BusinessAvatar logo={businessLogo} name={businessName} size={32} />
        <div className="min-w-0">
          <span className="text-xs font-bold text-foreground block truncate">{businessName || "Business"}</span>
          <span className="text-[10px] text-muted">{tt("الآن", "Just now")} · 🌐</span>
        </div>
      </div>
      <div className="px-3 py-2" dir="rtl">
        <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">{content.caption}</p>
      </div>
      {posterImage && (
        <img src={posterImage} alt="" className="w-full aspect-[4/3] object-cover" />
      )}
      <div className="flex items-center justify-between px-3 py-2 border-t border-card-border">
        <div className="flex items-center gap-1">
          <ThumbsUp size={14} className="text-[#1877F2]" />
          <span className="text-[10px] text-muted">24</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted">
          <span>3 {tt("تعليقات", "comments")}</span>
          <span>1 {tt("مشاركة", "share")}</span>
        </div>
      </div>
      <div className="flex items-center justify-around px-3 py-1.5 border-t border-card-border">
        <div className="flex items-center gap-1 text-muted text-[10px]">
          <ThumbsUp size={14} />
          <span>{tt("أعجبني", "Like")}</span>
        </div>
        <div className="flex items-center gap-1 text-muted text-[10px]">
          <MessageCircle size={14} />
          <span>{tt("تعليق", "Comment")}</span>
        </div>
        <div className="flex items-center gap-1 text-muted text-[10px]">
          <Share2 size={14} />
          <span>{tt("مشاركة", "Share")}</span>
        </div>
      </div>
    </>
  );
}

function TikTokContent({ content, posterImage, businessName, businessLogo }: ContentProps) {
  return (
    <div className="relative">
      {posterImage && (
        <img src={posterImage} alt="" className="w-full aspect-[9/12] object-cover" />
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-1.5 mb-1.5">
          <BusinessAvatar logo={businessLogo} name={businessName} size={18} className="border border-white/30" />
          <span className="text-white text-[10px] font-bold truncate">{businessName || "business"}</span>
        </div>
        <p className="text-white text-[10px] font-medium" dir="rtl">{content.storyText}</p>
        <p className="text-white/60 text-[9px] mt-1" dir="rtl">{content.hashtags.slice(0, 5).map(h => `#${h}`).join(" ")}</p>
      </div>
      <div className="absolute right-2 bottom-16 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center">
          <Heart size={16} className="text-white" />
          <span className="text-[8px] text-white">12.5K</span>
        </div>
        <div className="flex flex-col items-center">
          <MessageCircle size={16} className="text-white" />
          <span className="text-[8px] text-white">234</span>
        </div>
        <div className="flex flex-col items-center">
          <Bookmark size={16} className="text-white" />
          <span className="text-[8px] text-white">89</span>
        </div>
      </div>
    </div>
  );
}

function XContent({ content, posterImage, businessName, businessLogo }: ContentProps) {
  return (
    <>
      <div className="flex items-center gap-2 px-3 pt-3">
        <BusinessAvatar logo={businessLogo} name={businessName} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-foreground truncate">{businessName || "Business"}</span>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="#1DA1F2"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/></svg>
          </div>
          <span className="text-[10px] text-muted truncate">{toHandle(businessName)}</span>
        </div>
      </div>
      <div className="px-3 py-2" dir="rtl">
        <p className="text-xs text-foreground/80 leading-relaxed">{content.storyText}</p>
        <p className="text-[10px] text-primary/60 mt-1">{content.hashtags.slice(0, 3).map(h => `#${h}`).join(" ")}</p>
      </div>
      {posterImage && (
        <div className="mx-3 mb-2 rounded-xl overflow-hidden border border-card-border">
          <img src={posterImage} alt="" className="w-full aspect-video object-cover" />
        </div>
      )}
      <div className="flex items-center justify-between px-3 py-2 border-t border-card-border">
        <MessageCircle size={14} className="text-muted" />
        <Repeat2 size={14} className="text-muted" />
        <Heart size={14} className="text-muted" />
        <BarChart3 size={14} className="text-muted" />
        <Bookmark size={14} className="text-muted" />
      </div>
    </>
  );
}

function WhatsAppContent({ content, posterImage }: ContentProps) {
  return (
    <div className="bg-[#ECE5DD] dark:bg-[#0b141a] p-3 space-y-2 min-h-[200px]">
      {posterImage && (
        <div className="bg-white dark:bg-[#1f2c34] rounded-lg rounded-tr-none overflow-hidden max-w-[85%] ml-auto shadow-sm">
          <img src={posterImage} alt="" className="w-full aspect-square object-cover" />
          <div className="p-2" dir="rtl">
            <p className="text-[10px] text-foreground/80 line-clamp-3 leading-relaxed">{content.caption}</p>
            <p className="text-[9px] text-primary/60 mt-1">{content.hashtags.slice(0, 4).map(h => `#${h}`).join(" ")}</p>
          </div>
          <div className="flex items-center justify-end gap-1 px-2 pb-1">
            <span className="text-[9px] text-muted">10:30 PM</span>
            <div className="flex">
              <Check size={10} className="text-[#53bdeb]" />
              <Check size={10} className="text-[#53bdeb] -ml-1.5" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SnapchatContent({ content, posterImage, businessName, businessLogo }: ContentProps) {
  return (
    <div className="relative">
      {posterImage && (
        <img src={posterImage} alt="" className="w-full aspect-[9/14] object-cover" />
      )}
      <div className="absolute inset-0 flex flex-col justify-between p-2">
        {/* Top: story progress + name */}
        <div className="space-y-2">
          <div className="h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-white rounded-full" />
          </div>
          <div className="flex items-center gap-1.5">
            <BusinessAvatar logo={businessLogo} name={businessName} size={20} className="border border-white/40" />
            <span className="text-white text-[10px] font-bold truncate drop-shadow">{businessName || "business"}</span>
          </div>
        </div>
        {/* Bottom: story text */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-2" dir="rtl">
          <p className="text-white text-[10px] font-medium">{content.storyText}</p>
        </div>
      </div>
    </div>
  );
}
