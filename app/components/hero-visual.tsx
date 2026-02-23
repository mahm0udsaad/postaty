"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale } from "@/hooks/use-locale";
import { Scan, Sparkles, Wand2, Maximize2, Palette, Type } from "lucide-react";

const themes = [
  {
    id: "burger",
    image: "/showcase/burger-stack.jpeg",
    type: "Food & Beverage",
    stats: { color: "98%", layout: "100%", copy: "AI Gen" },
    accent: "text-orange-500",
    bg: "bg-orange-500/20"
  },
  {
    id: "beauty",
    image: "/showcase/skincare-promo.jpeg",
    type: "Beauty & Care",
    stats: { color: "95%", layout: "Smart", copy: "Auto" },
    accent: "text-emerald-500",
    bg: "bg-emerald-500/20"
  },
  {
    id: "ramadan",
    image: "/showcase/ramadan-card.jpeg",
    type: "Seasonal Event",
    stats: { color: "Gold", layout: "Classic", copy: "Arabic" },
    accent: "text-purple-500",
    bg: "bg-purple-500/20"
  }
];

export function HeroVisual() {
  const { t } = useLocale();
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % themes.length);
    }, 6000); // Slower cycle to appreciate the scan
    return () => clearInterval(interval);
  }, []);

  const theme = themes[index];

  if (!mounted) return null;

  return (
    <div className="relative w-full max-w-[500px] aspect-[4/5] mx-auto lg:mx-0 flex items-center justify-center perspective-1000">
      
      {/* Container Frame */}
      <div className="relative w-full h-full rounded-[2rem] bg-[#0A0A0E] border border-white/10 shadow-2xl overflow-hidden group">
        
        {/* Top HUD */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-30 flex items-center justify-between px-6">
           <div className="flex items-center gap-2">
             <div className={`p-1.5 rounded-lg ${theme.bg} ${theme.accent} animate-pulse`}>
               <Scan size={16} />
             </div>
             <div className="flex flex-col">
               <span className="text-[10px] text-white/50 font-mono tracking-widest uppercase">SCANNING MODE</span>
               <span className="text-xs font-bold text-white">{theme.type}</span>
             </div>
           </div>
           <div className="flex gap-1">
             {[1, 2, 3].map((i) => (
               <div key={i} className={`w-1 h-1 rounded-full ${i === 1 ? "bg-green-500" : "bg-white/20"}`} />
             ))}
           </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={theme.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full"
          >
            {/* LAYER 1: The Blueprint (Wireframe simulation) */}
            <div className="absolute inset-0 bg-[#0F0F15]">
               {/* Use the image but heavily processed to look like a blueprint */}
               <Image
                 src={theme.image}
                 alt="Blueprint"
                 fill
                 className="object-cover opacity-30 grayscale contrast-150 blur-[2px]"
               />
               {/* Wireframe Grid Overlay */}
               <div className="absolute inset-0 bg-[url('/tmp-test-grid.png')] bg-repeat opacity-20 mix-blend-overlay" />
               <div className="absolute inset-0 border-[0.5px] border-white/10 m-8 rounded-xl border-dashed" />
               
               {/* Floating Blueprint Markers */}
               <div className="absolute top-1/3 left-1/4 border border-blue-500/50 w-24 h-12 rounded flex items-center justify-center text-[10px] text-blue-400 font-mono bg-blue-500/10">
                 PLACEHOLDER
               </div>
               <div className="absolute bottom-1/4 right-1/4 border border-blue-500/50 w-32 h-32 rounded-full flex items-center justify-center text-[10px] text-blue-400 font-mono bg-blue-500/10">
                 HERO_IMG_01
               </div>
            </div>

            {/* LAYER 2: The Reality (Final Image) - Revealed by Scanner */}
            <motion.div 
              className="absolute inset-0 overflow-hidden"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 3, ease: "easeInOut", delay: 0.5 }}
            >
              <Image
                src={theme.image}
                alt="Final Design"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
            </motion.div>

            {/* LAYER 3: The Scanner Bar */}
            <motion.div
               className="absolute top-0 bottom-0 w-1 bg-white z-20 shadow-[0_0_50px_rgba(255,255,255,0.8)]"
               initial={{ left: "0%" }}
               animate={{ left: "100%" }}
               transition={{ duration: 3, ease: "easeInOut", delay: 0.5 }}
            >
               <div className="absolute top-1/2 -translate-y-1/2 -left-[14px] w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                 <Wand2 size={16} className="text-black" />
               </div>
               <div className="absolute inset-y-0 -left-12 w-12 bg-gradient-to-r from-transparent to-white/30" />
            </motion.div>
            
            {/* LAYER 4: Pop-up Stats (Triggered by scan) */}
            <motion.div
              className="absolute bottom-24 left-6 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-xl z-30"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2 }}
            >
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                   <Palette size={14} className="text-white" />
                 </div>
                 <div>
                   <div className="text-[10px] text-white/60 font-medium uppercase">Color Grading</div>
                   <div className="text-sm font-bold text-white">{theme.stats.color} Match</div>
                 </div>
               </div>
            </motion.div>

            <motion.div
              className="absolute top-32 right-6 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-xl z-30"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-white border border-white/10">
                   <Type size={14} />
                 </div>
                 <div>
                   <div className="text-[10px] text-white/60 font-medium uppercase">Smart Copy</div>
                   <div className="text-sm font-bold text-white">{theme.stats.copy}</div>
                 </div>
               </div>
            </motion.div>

          </motion.div>
        </AnimatePresence>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#0A0A0E]/90 backdrop-blur border-t border-white/10 z-30 flex items-center justify-between px-6">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">AI Processor Online</span>
             </div>
           </div>
           <div className="flex items-center gap-2 text-white/40">
              <Maximize2 size={14} />
              <span className="text-[10px] font-mono">1080x1350</span>
           </div>
        </div>

      </div>

      {/* Decorative Glow */}
      <div className={`absolute -inset-4 bg-gradient-to-br from-primary/30 to-accent/30 rounded-[2.5rem] blur-2xl -z-10 opacity-40`} />

    </div>
  );
}
