"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Sparkles, Zap, Layers, Share2, MousePointer2 } from "lucide-react";

const themes = [
  {
    id: "burger",
    image: "/showcase/burger-stack.jpeg",
    title: "MEGA BURGER",
    subtitle: "TASTE THE FIRE",
    cta: "ORDER NOW",
    color: "from-orange-500 to-red-600",
    shadow: "shadow-orange-500/20",
    accent: "bg-yellow-400"
  },
  {
    id: "beauty",
    image: "/showcase/skincare-promo.jpeg",
    title: "PURE GLOW",
    subtitle: "NATURAL ESSENCE",
    cta: "SHOP SALE",
    color: "from-emerald-400 to-teal-600",
    shadow: "shadow-emerald-500/20",
    accent: "bg-emerald-200"
  },
  {
    id: "ramadan",
    image: "/showcase/ramadan-card.jpeg",
    title: "RAMADAN",
    subtitle: "KAREEM & BLESSINGS",
    cta: "SEND GIFT",
    color: "from-indigo-600 to-purple-700",
    shadow: "shadow-purple-500/20",
    accent: "bg-amber-400"
  }
];

export function HeroVisual() {
  const [index, setIndex] = useState(0);
  const [lowPowerMode, setLowPowerMode] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % themes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 1024px)");
    const sync = () => setLowPowerMode(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const theme = themes[index];

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto lg:mx-0 flex items-center justify-center perspective-[1200px] group">
      
      {/* Ambient Glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.color} opacity-15 blur-[64px] transition-colors duration-1000`} />

      {/* 3D Container */}
      <motion.div
        className="relative w-[320px] h-[400px] preserve-3d"
        animate={
          lowPowerMode
            ? { rotateY: 0, rotateX: 0 }
            : { rotateY: [0, -10, 0, 10, 0], rotateX: [0, 5, 0, -5, 0] }
        }
        transition={
          lowPowerMode
            ? { duration: 0.25 }
            : { duration: 10, ease: "easeInOut", repeat: Infinity }
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme.id}
            className="absolute inset-0 preserve-3d"
            initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 1.2, rotateY: -90 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          >
            {/* LAYER 1: Back (Base Card) */}
            <motion.div 
              className={`absolute inset-0 rounded-[2rem] bg-surface-1 border border-white/10 ${theme.shadow} shadow-2xl overflow-hidden`}
              style={{ translateZ: -40 }}
            >
               <div className="absolute inset-0 bg-grid-pattern opacity-50" />
            </motion.div>

            {/* LAYER 2: The Image (Middle) */}
            <motion.div 
              className="absolute inset-4 rounded-[1.5rem] overflow-hidden shadow-lg"
              style={{ translateZ: 20 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Image
                src={theme.image}
                alt={theme.title}
                fill
                sizes="(max-width: 1024px) 78vw, 320px"
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
            </motion.div>

            {/* LAYER 3: Graphics & UI (Front) */}
            <motion.div 
              className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none"
              style={{ translateZ: 60 }}
            >
               {/* Header Badge */}
               <motion.div 
                 className="flex justify-between items-start"
                 initial={{ y: -20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.4 }}
               >
                 <div className="bg-white/10 border border-white/20 rounded-full px-3 py-1 flex items-center gap-2">
                    <Sparkles size={12} className="text-white" />
                    <span className="text-[10px] font-bold text-white tracking-wider">AI GENERATED</span>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <Share2 size={14} className="text-white" />
                 </div>
               </motion.div>

               {/* Typography & CTA */}
               <motion.div
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.5 }}
               >
                 <h2 className="text-4xl font-black text-white leading-[0.9] mb-1 drop-shadow-2xl italic tracking-tighter">
                   {theme.title}
                 </h2>
                 <p className="text-lg font-medium text-white/90 mb-4 tracking-wide uppercase">
                   {theme.subtitle}
                 </p>
                 
                 <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl ${theme.accent} text-black font-bold shadow-xl transform hover:scale-105 transition-transform`}>
                   <span>{theme.cta}</span>
                   <MousePointer2 size={16} className="rotate-[-15deg]" />
                 </div>
               </motion.div>
            </motion.div>

            {/* LAYER 4: Floating Particles (Orbiting) */}
            <motion.div 
              className="absolute -right-8 top-1/4 w-12 h-12 bg-surface-1/85 rounded-2xl border border-white/10 flex items-center justify-center shadow-xl"
              style={{ translateZ: 80 }}
              animate={lowPowerMode ? { y: 0 } : { y: [0, -10, 0] }}
              transition={lowPowerMode ? { duration: 0.25 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
               <Zap size={20} className="text-primary" />
            </motion.div>

            <motion.div 
              className="absolute -left-6 bottom-1/3 w-10 h-10 bg-surface-1/85 rounded-full border border-white/10 flex items-center justify-center shadow-xl"
              style={{ translateZ: 100 }}
              animate={lowPowerMode ? { y: 0 } : { y: [0, 10, 0] }}
              transition={lowPowerMode ? { duration: 0.25 } : { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
               <Layers size={18} className="text-accent" />
            </motion.div>

          </motion.div>
        </AnimatePresence>
      </motion.div>
      
      {/* Floor Reflection/Shadow */}
      <div className="absolute -bottom-12 w-[200px] h-[20px] bg-black/20 blur-xl rounded-[100%]" />
    </div>
  );
}
