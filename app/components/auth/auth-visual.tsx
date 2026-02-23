"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale } from "@/hooks/use-locale";
import { Sparkles, Wand2, CheckCircle2 } from "lucide-react";

const showcaseImages = [
  "/showcase/burger-stack.jpeg",
  "/showcase/skincare-promo.jpeg",
  "/showcase/ramadan-card.jpeg",
  "/showcase/supermarket-fruits.jpeg",
  "/showcase/chicken-offer.jpeg",
  "/showcase/book-promo.jpeg",
  "/showcase/shawrma.jpeg",
  "/showcase/ramadan-platter.jpeg",
  "/showcase/supermarket-basics.jpeg",
];

export function AuthVisual() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"input" | "generating" | "result">("input");

  useEffect(() => {
    setMounted(true);
    
    // Animation cycle
    const cycleAnimation = async () => {
      while (true) {
        setStep("input");
        await new Promise(r => setTimeout(r, 2500)); // Type time
        setStep("generating");
        await new Promise(r => setTimeout(r, 2000)); // Generate time
        setStep("result");
        await new Promise(r => setTimeout(r, 4000)); // Show time
      }
    };
    
    cycleAnimation();
  }, []);

  // Split images into two columns for the marquee effect
  const column1 = showcaseImages.slice(0, 5);
  const column2 = showcaseImages.slice(5);

  const MarqueeColumn = ({ images, reverse = false }: { images: string[], reverse?: boolean }) => (
    <div className="flex flex-col gap-4 w-full h-full relative overflow-hidden">
      <motion.div
        className="flex flex-col gap-4 w-full"
        initial={{ y: reverse ? -1000 : 0 }}
        animate={{ y: reverse ? 0 : -1000 }}
        transition={{
          repeat: Infinity,
          duration: 40,
          ease: "linear",
          repeatType: "loop"
        }}
      >
        {[...images, ...images, ...images].map((src, idx) => (
          <div key={idx} className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-lg border border-white/10 opacity-60">
            <Image
              src={src}
              alt="Showcase"
              fill
              className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={idx < 2}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col justify-center items-center bg-surface-2">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* Marquee Background (Subtler) */}
      <div className="absolute inset-0 flex gap-6 p-4 opacity-20 rotate-6 scale-110 pointer-events-none">
        <div className="flex-1 h-full">
           <MarqueeColumn images={column1} />
        </div>
        <div className="flex-1 h-full pt-20">
           <MarqueeColumn images={column2} reverse />
        </div>
        <div className="flex-1 h-full hidden xl:block">
           <MarqueeColumn images={column1} />
        </div>
      </div>

      {/* Interactive Brand Card */}
      <div className="relative z-10 w-full max-w-sm px-4">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5 }}
           className="relative bg-surface-1/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 relative">
                 <Image src="/icon_logo_svg.svg" alt="Postaty" fill className="object-contain" />
              </div>
              <span className="font-bold text-lg tracking-tight">Postaty<span className="text-primary">.ai</span></span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
          </div>

          {/* Body */}
          <div className="p-6 min-h-[320px] flex flex-col">
            <AnimatePresence mode="wait">
              
              {/* Step 1: Input */}
              {step === "input" && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-4 my-auto"
                >
                  <div className="text-sm font-medium text-muted-foreground ml-1">
                    {t("ماذا تريد أن تصمم؟", "What do you want to design?")}
                  </div>
                  <div className="relative">
                    <div className="w-full p-4 rounded-xl bg-surface-2 border border-card-border text-foreground min-h-[80px] text-lg leading-relaxed shadow-inner">
                      <Typewriter text={t("إعلان برجر شهي مع خصم 50%...", "Delicious burger ad with 50% discount...")} />
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-0.5 h-5 ml-1 bg-primary align-middle"
                      />
                    </div>
                  </div>
                  <motion.button
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Wand2 size={18} />
                    {t("توليد التصميم", "Generate Design")}
                  </motion.button>
                </motion.div>
              )}

              {/* Step 2: Generating */}
              {step === "generating" && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-6 my-auto"
                >
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-surface-2" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="text-primary animate-pulse" size={24} />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">{t("جاري التصميم...", "Designing...")}</h3>
                    <p className="text-sm text-muted-foreground">{t("الذكاء الاصطناعي يحلل طلبك", "AI is analyzing your request")}</p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Result */}
              {step === "result" && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full"
                >
                   <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg mb-4 group">
                     <Image
                       src="/showcase/burger-stack.jpeg"
                       alt="Result"
                       fill
                       className="object-cover transition-transform duration-500 group-hover:scale-105"
                     />
                     
                     {/* Overlay Badge */}
                     <motion.div 
                       initial={{ scale: 0, rotate: -20 }}
                       animate={{ scale: 1, rotate: 0 }}
                       transition={{ delay: 0.3, type: "spring" }}
                       className="absolute top-4 right-4 bg-white/90 backdrop-blur text-black font-bold px-3 py-1 rounded-full text-xs shadow-lg"
                     >
                       50% OFF
                     </motion.div>
                   </div>
                   
                   <div className="mt-auto">
                     <div className="flex items-center gap-2 text-success font-medium mb-3">
                       <CheckCircle2 size={18} />
                       <span>{t("تم التصميم بنجاح!", "Design Ready!")}</span>
                     </div>
                     <div className="flex gap-2">
                       <button className="flex-1 py-2.5 bg-surface-2 hover:bg-surface-3 text-foreground rounded-lg text-sm font-medium transition-colors">
                         {t("تعديل", "Edit")}
                       </button>
                       <button className="flex-1 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20">
                         {t("تحميل", "Download")}
                       </button>
                     </div>
                   </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Decorative Glows */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-[50px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-[50px] pointer-events-none" />
        </motion.div>
      </div>
    </div>
  );
}

// Helper for typing effect
function Typewriter({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
}