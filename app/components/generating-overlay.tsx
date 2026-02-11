"use client";

import { motion } from "framer-motion";
import { Sparkles, Loader2, Brain, Palette, Layers } from "lucide-react";
import { useEffect, useState } from "react";

const MESSAGES = [
  { icon: Brain, text: "تحليل الفكرة..." },
  { icon: Palette, text: "اختيار الألوان..." },
  { icon: Layers, text: "بناء التنسيق..." },
  { icon: Sparkles, text: "إضافة اللمسات السحرية..." },
];

export function GeneratingOverlay() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = MESSAGES[msgIndex].icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center text-white"
    >
      <div className="relative w-32 h-32 mb-8">
        {/* Pulsing Orbs */}
        <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-primary/40 rounded-full blur-2xl"
        />
        <motion.div 
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            className="absolute inset-0 bg-accent/40 rounded-full blur-2xl"
        />
        
        {/* Center Logo/Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
                key={msgIndex}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                <CurrentIcon size={48} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </motion.div>
        </div>
        
        {/* Spinning Rings */}
        <div className="absolute inset-[-10px] border border-white/10 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-[-20px] border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
      </div>

      <motion.div
        key={msgIndex}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 text-center px-4"
      >
        {MESSAGES[msgIndex].text}
      </motion.div>
      
      <p className="mt-4 text-slate-400 text-sm animate-pulse">جاري التصميم بواسطة الذكاء الاصطناعي...</p>
    </motion.div>
  );
}
