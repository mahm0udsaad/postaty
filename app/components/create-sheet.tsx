"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ChevronRight } from "lucide-react";
import { CategorySelector } from "./category-selector";
import { RestaurantForm } from "./forms/restaurant-form";
import { SupermarketForm } from "./forms/supermarket-form";
import { OnlineForm } from "./forms/online-form";
import type { Category, PostFormData } from "@/lib/types";

interface CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PostFormData) => void;
  isLoading: boolean;
}

export function CreateSheet({ isOpen, onClose, onSubmit, isLoading }: CreateSheetProps) {
  const [category, setCategory] = useState<Category | null>(null);

  const handleBack = () => {
    if (category) {
      setCategory(null);
    } else {
      onClose();
    }
  };

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[70] bg-slate-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] md:inset-x-auto md:left-1/2 md:top-1/2 md:bottom-auto md:w-[600px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:h-[85vh] md:max-h-[800px] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
               <div className="flex items-center gap-2">
                 {(category || (category === null && isOpen)) && (
                    <button 
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        {category ? <ArrowLeft size={20} className="text-slate-600" /> : <X size={20} className="text-slate-600" />}
                    </button>
                 )}
                 <h2 className="text-lg font-bold text-slate-800">
                    {category ? "أدخل التفاصيل" : "ماذا تريد أن تصمم؟"}
                 </h2>
               </div>
               {category && (
                 <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {category === "restaurant" && "مطاعم"}
                    {category === "supermarket" && "سوبر ماركت"}
                    {category === "online" && "منتجات"}
                 </span>
               )}
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain bg-slate-50 p-4 pb-24 md:pb-4 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {!category ? (
                        <motion.div
                            key="categories"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="py-4"
                        >
                            <CategorySelector onSelect={setCategory} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
                                {category === "restaurant" && (
                                    <RestaurantForm onSubmit={onSubmit} isLoading={isLoading} />
                                )}
                                {category === "supermarket" && (
                                    <SupermarketForm onSubmit={onSubmit} isLoading={isLoading} />
                                )}
                                {category === "online" && (
                                    <OnlineForm onSubmit={onSubmit} isLoading={isLoading} />
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Mobile safe area spacer if needed */}
            <div className="md:hidden h-[env(safe-area-inset-bottom)] bg-white" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
