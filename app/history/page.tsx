"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDevIdentity } from "@/hooks/use-dev-identity";
import { GenerationCard } from "./generation-card";
import { Clock, Inbox, Loader2 } from "lucide-react";

export default function HistoryPage() {
  const { orgId } = useDevIdentity();
  const generations = useQuery(api.generations.listByOrg, {
    orgId,
    limit: 50,
  });

  const isLoading = generations === undefined;

  return (
    <main className="min-h-screen py-12 px-4 relative overflow-hidden bg-grid-pattern">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full border border-slate-200/60 shadow-sm animate-fade-in-up">
            <Clock size={24} className="text-primary" />
            <span className="text-slate-700 font-semibold tracking-wide text-sm">سجل الإنشاءات</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900 animate-gradient-flow">
            سجل الإنشاءات
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed font-light">
            عرض جميع البوسترات التي تم إنشاؤها سابقاً
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <Inbox size={36} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              لا توجد إنشاءات بعد
            </h3>
            <p className="text-slate-500">
              ابدأ بإنشاء أول بوستر من صفحة الإنشاء
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {generations.map((gen) => (
              <GenerationCard key={gen._id} generation={gen} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
