"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Film, Sparkles } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/hooks/use-locale";

interface ReelUpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReelUpgradePrompt({ isOpen, onClose }: ReelUpgradePromptProps) {
  const { t } = useLocale();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md bg-surface-1 rounded-3xl shadow-2xl border border-card-border overflow-hidden">
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-2 text-muted transition-colors z-10"
              >
                <X size={18} />
              </button>

              <div className="p-8 text-center space-y-6">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Film size={28} className="text-purple-500" />
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {t("ميزة تحويل الصورة إلى ريلز", "Turn Image into Reel")}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">
                    {t(
                      "ميزة الريلز متاحة فقط للمشتركين في باقة Starter وما فوق. قم بالترقية للاستمتاع بتحويل تصاميمك إلى فيديوهات قصيرة جاهزة للنشر.",
                      "Reels are available on Starter plan and above. Upgrade to turn your designs into short videos ready for publishing."
                    )}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 text-sm text-right">
                  {[
                    t("تحويل أي تصميم إلى فيديو 9:16 ريلز", "Convert any design to 9:16 Reel video"),
                    t("رسوم متحركة احترافية بالذكاء الاصطناعي", "Professional AI-powered animations"),
                    t("تحميل MP4 جاهز للنشر على إنستغرام وتيك توك", "Download MP4 ready for Instagram & TikTok"),
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Sparkles size={14} className="text-purple-500 shrink-0" />
                      <span className="text-foreground/80">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link href="/pricing" onClick={onClose}>
                  <button className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all active:scale-[0.98]">
                    {t("ترقية الاشتراك", "Upgrade Plan")}
                  </button>
                </Link>

                <button
                  onClick={onClose}
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  {t("ليس الآن", "Not now")}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
