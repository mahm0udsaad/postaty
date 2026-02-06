"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDevIdentity } from "@/hooks/use-dev-identity";
import { BrandKitForm } from "./brand-kit-form";
import { Palette, Loader2 } from "lucide-react";

export default function BrandKitPage() {
  const { orgId } = useDevIdentity();
  const existingKit = useQuery(api.brandKits.getDefault, { orgId });

  // Show loading while query initializes (undefined = loading, null = no kit)
  const isLoading = existingKit === undefined;

  return (
    <main className="min-h-screen py-12 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4 bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20 shadow-sm">
            <Palette size={24} className="text-primary" />
            <span className="text-primary font-semibold tracking-wide text-sm">تخصيص العلامة</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
            هوية العلامة التجارية
          </h1>
          <p className="text-muted text-lg max-w-xl mx-auto leading-relaxed">
            أضف شعارك وألوانك لتطبيقها تلقائياً على كل البوسترات التي تنشئها
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 p-6 md:p-8">
            <BrandKitForm
              existingKit={existingKit ?? undefined}
              orgId={orgId}
            />
          </div>
        )}
      </div>
    </main>
  );
}
