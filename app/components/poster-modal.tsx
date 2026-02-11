"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { PosterResult } from "@/lib/types";

interface PosterModalProps {
  result: PosterResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAsTemplate?: (designIndex: number) => void;
}

export function PosterModal({ result, isOpen, onClose, onSaveAsTemplate }: PosterModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  
  // Reset state when modal opens/changes
  useEffect(() => {
    setIsExporting(false);
  }, [result, isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !result) return null;

  const handleExport = async () => {
    if (!result.imageBase64) return;
    setIsExporting(true);
    try {
        const base64Data = result.imageBase64.includes(",")
          ? result.imageBase64.split(",")[1]
          : result.imageBase64;
        const mimeType = result.imageBase64.includes(",")
          ? result.imageBase64.split(",")[0].split(":")[1].split(";")[0]
          : "image/png";

        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `poster-${result.designNameAr || result.designIndex + 1}-${result.format}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!("share" in navigator) || !result.imageBase64) return;
    try {
        const base64Data = result.imageBase64.includes(",")
        ? result.imageBase64.split(",")[1]
        : result.imageBase64;
      const mimeType = result.imageBase64.includes(",")
        ? result.imageBase64.split(",")[0].split(":")[1].split(";")[0]
        : "image/png";

      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const file = new File([blob], `poster.png`, { type: "image/png" });
      await navigator.share({ files: [file] });
    } catch {
      // Ignored
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl h-full max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            {/* Close Button Mobile */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-black/20 text-white rounded-full backdrop-blur-md md:hidden"
            >
                <X size={20} />
            </button>

            {/* Image Section */}
            <div className="flex-1 bg-slate-100 relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
                <div 
                    className="absolute inset-0 opacity-10"
                    style={{ 
                        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
                        backgroundSize: '20px 20px' 
                    }}
                />
                
                <motion.div 
                    layoutId={`poster-img-${result.designIndex}`}
                    className="relative max-h-full max-w-full shadow-2xl rounded-lg overflow-hidden"
                >
                     {result.imageBase64 ? (
                        <img
                            src={result.imageBase64}
                            alt="Full Preview"
                            className="max-h-[calc(90vh-4rem)] md:max-h-[80vh] w-auto object-contain"
                        />
                    ) : (
                        <div className="w-64 h-64 flex items-center justify-center bg-slate-200 text-slate-400">
                            No Image
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Sidebar / Controls */}
            <div className="w-full md:w-80 bg-white border-l border-slate-200 p-6 flex flex-col gap-6 z-20">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">تفاصيل التصميم</h2>
                    <button 
                        onClick={onClose}
                        className="hidden md:flex p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 flex-1">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="text-sm font-medium text-slate-500">العنوان المقترح</div>
                        <div className="font-bold text-slate-900">{result.designNameAr || "بدون عنوان"}</div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="text-sm font-medium text-slate-500">التنسيق</div>
                        <div className="font-bold text-slate-900 uppercase">{result.format}</div>
                    </div>
                </div>

                <div className="space-y-3 mt-auto">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                        <span>تحميل الصورة</span>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        {typeof navigator !== "undefined" && "share" in navigator && (
                            <button
                                onClick={handleShare}
                                className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-all active:scale-95"
                            >
                                <Share2 size={18} />
                                <span>مشاركة</span>
                            </button>
                        )}
                        
                        {onSaveAsTemplate && (
                            <button
                                onClick={() => onSaveAsTemplate(result.designIndex)}
                                className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-all active:scale-95 col-span-1"
                            >
                                <Save size={18} />
                                <span>حفظ</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
