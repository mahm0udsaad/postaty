"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Sparkles, History } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";

// Components
import { HeroVisual } from "./components/hero-visual";

const AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  
  // Handlers
  const handleStartCreate = () => {
    router.push("/create");
  };

  return (
    <main className="min-h-screen relative bg-slate-50 overflow-x-hidden pb-32 md:pb-0">
      <div className="bg-grid-pattern absolute inset-0 opacity-50 pointer-events-none" />
      
      {/* Hero / Dashboard Header */}
      <div className="relative pt-8 pb-12 px-4 md:pt-12 md:pb-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center justify-between gap-8">
           <div className="flex-1 space-y-6 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                <Sparkles size={14} />
                <span>الذكاء الاصطناعي 2.0</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
                أطلق العنان <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  لإبداعك
                </span>
              </h1>
              <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
                أنشئ تصاميم احترافية لمتجرك أو مطعمك في ثوانٍ. ابدأ الآن بلمسة واحدة.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                {!isAuthenticated ? (
                   AUTH_ENABLED ? (
                     <SignInButton mode="modal">
                       <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform">
                          ابدأ مجاناً
                       </button>
                     </SignInButton>
                   ) : (
                     <Link
                       href="/create"
                       className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform"
                     >
                       ابدأ الآن
                     </Link>
                   )
                ) : (
                    <button 
                        onClick={handleStartCreate}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
                    >
                        <Plus size={24} />
                        <span>تصميم جديد</span>
                    </button>
                )}
              </div>
           </div>
           
           <div className="w-full max-w-md lg:max-w-lg">
              <HeroVisual />
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isAuthenticated && (
            <div>
                <div className="flex items-center gap-2 mb-8 opacity-60">
                    <History size={20} />
                    <h3 className="text-lg font-bold">أحدث النماذج</h3>
                </div>
                
                {/* Empty State / Call to Action */}
                <div 
                    onClick={handleStartCreate}
                    className="group border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300"
                >
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                        <Plus size={32} className="text-slate-400 group-hover:text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">أنشئ أول تصميم لك</h3>
                    <p className="text-slate-500">اضغط هنا لبدء رحلة الإبداع</p>
                </div>
            </div>
        )}
      </div>

      {/* Mobile FAB Trigger */}
      {isAuthenticated && (
        <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleStartCreate}
            className="md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
            <Plus size={28} />
        </motion.button>
      )}

    </main>
  );
}
