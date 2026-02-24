import type { SocialPlatform, MarketingContent } from "@/lib/types";

// ── Platform Definitions ─────────────────────────────────────────

export interface PlatformDef {
  id: SocialPlatform;
  name: string;
  nameAr: string;
  color: string;
  headerBg: string;
  headerText: string;
}

export const PLATFORMS: PlatformDef[] = [
  { id: "instagram", name: "Instagram", nameAr: "انستقرام", color: "#E1306C", headerBg: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400", headerText: "text-white" },
  { id: "facebook", name: "Facebook", nameAr: "فيسبوك", color: "#1877F2", headerBg: "bg-[#1877F2]", headerText: "text-white" },
  { id: "tiktok", name: "TikTok", nameAr: "تيك توك", color: "#000000", headerBg: "bg-black", headerText: "text-white" },
  { id: "x", name: "X", nameAr: "إكس", color: "#000000", headerBg: "bg-black", headerText: "text-white" },
  { id: "whatsapp", name: "WhatsApp", nameAr: "واتساب", color: "#25D366", headerBg: "bg-[#25D366]", headerText: "text-white" },
  { id: "snapchat", name: "Snapchat", nameAr: "سناب شات", color: "#FFFC00", headerBg: "bg-[#FFFC00]", headerText: "text-black" },
];

// ── Build platform-optimized copy text ───────────────────────────

export function buildPlatformText(platformId: SocialPlatform, content: MarketingContent): string {
  const hashtagStr = content.hashtags.map(h => `#${h}`).join(" ");

  switch (platformId) {
    case "instagram":
    case "facebook":
    case "whatsapp":
      return `${content.caption}\n\n${hashtagStr}`;
    case "tiktok":
      return `${content.storyText}\n\n${hashtagStr}`;
    case "x": {
      const shortHashtags = content.hashtags.slice(0, 3).map(h => `#${h}`).join(" ");
      const xText = `${content.storyText}\n\n${shortHashtags}`;
      return xText.length > 280 ? xText.slice(0, 277) + "..." : xText;
    }
    case "snapchat":
      return content.storyText;
  }
}
