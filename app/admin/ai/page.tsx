"use client";

import useSWR from "swr";
import {
  Activity,
  CheckCircle2,
  XCircle,
  DollarSign,
  ImageIcon,
  Clock,
  Loader2,
  Brain,
  Cpu,
} from "lucide-react";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

const PERIOD_OPTIONS = [
  { label: "7 أيام", value: 7 },
  { label: "30 يوم", value: 30 },
  { label: "90 يوم", value: 90 },
];

export default function AdminAiPage() {
  const [periodDays, setPeriodDays] = useState(30);
  const { data: overviewData } = useSWR(`/api/admin/overview?periodDays=${periodDays}`, fetcher);
  const { data: dailyUsageData } = useSWR(`/api/admin/daily-usage?periodDays=${periodDays}`, fetcher);
  const dailyUsage = dailyUsageData?.dailyUsage;

  const overview = overviewData?.ai;

  if (!overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  const maxDailyRequests = dailyUsage
    ? Math.max(...dailyUsage.map((d: any) => d.requests), 1)
    : 1;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black mb-2">تحليلات AI</h1>
          <p className="text-muted">أداء النماذج واستهلاك الموارد</p>
        </div>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriodDays(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                periodDays === opt.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-surface-2/50 text-muted hover:text-foreground border border-card-border"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-1 border border-card-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Activity size={20} className="text-primary" />
            </div>
            <span className="text-sm text-muted font-medium">إجمالي الطلبات</span>
          </div>
          <div className="text-2xl font-black">{overview.totalRequests}</div>
        </div>

        <div className="bg-surface-1 border border-card-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-success/10 rounded-xl">
              <CheckCircle2 size={20} className="text-success" />
            </div>
            <span className="text-sm text-muted font-medium">نسبة النجاح</span>
          </div>
          <div className="text-2xl font-black">{(overview.successRate * 100).toFixed(1)}%</div>
          <div className="text-xs text-muted mt-1">
            {overview.successCount} ناجح / {overview.failureCount} فاشل
          </div>
        </div>

        <div className="bg-surface-1 border border-card-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-accent/10 rounded-xl">
              <DollarSign size={20} className="text-accent" />
            </div>
            <span className="text-sm text-muted font-medium">تكلفة AI الإجمالية</span>
          </div>
          <div className="text-2xl font-black">${overview.totalCostUsd.toFixed(4)}</div>
        </div>

        <div className="bg-surface-1 border border-card-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ImageIcon size={20} className="text-primary" />
            </div>
            <span className="text-sm text-muted font-medium">الصور المولدة</span>
          </div>
          <div className="text-2xl font-black">{overview.totalImages}</div>
        </div>
      </div>

      {/* Model Strategy Info */}
      <div className="bg-surface-1 border border-card-border rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Brain size={20} className="text-primary" />
          <h3 className="font-bold text-lg">استراتيجية النماذج</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-2/50 border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={16} className="text-accent" />
              <span className="font-bold text-sm">المستخدمون المدفوعون</span>
            </div>
            <code className="text-xs bg-surface-2 px-2 py-1 rounded-lg">gemini-3-pro-image-preview</code>
            <p className="text-xs text-muted mt-2">جودة عالية، تفاصيل دقيقة، تكلفة أعلى</p>
          </div>
          <div className="bg-surface-2/50 border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={16} className="text-success" />
              <span className="font-bold text-sm">المستخدمون المجانيون</span>
            </div>
            <code className="text-xs bg-surface-2 px-2 py-1 rounded-lg">gemini-2.5-flash-image</code>
            <p className="text-xs text-muted mt-2">سرعة عالية، تكلفة منخفضة، جودة جيدة</p>
          </div>
        </div>
      </div>

      {/* Model Usage Table */}
      {Object.keys(overview.byModel).length > 0 && (
        <div className="bg-surface-1 border border-card-border rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-lg mb-4">استخدام النماذج</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-right py-3 px-3 font-medium text-muted">النموذج</th>
                  <th className="text-right py-3 px-3 font-medium text-muted">الطلبات</th>
                  <th className="text-right py-3 px-3 font-medium text-muted">التكلفة</th>
                  <th className="text-right py-3 px-3 font-medium text-muted">الصور</th>
                  <th className="text-right py-3 px-3 font-medium text-muted">متوسط المدة</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(overview.byModel).map(([model, stats]: [string, any]) => (
                  <tr key={model} className="border-b border-card-border/50">
                    <td className="py-3 px-3">
                      <code className="text-xs bg-surface-2 px-2 py-1 rounded-lg">{model}</code>
                    </td>
                    <td className="py-3 px-3 font-bold">{stats.count}</td>
                    <td className="py-3 px-3 font-bold">${stats.cost.toFixed(4)}</td>
                    <td className="py-3 px-3">{stats.images}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-muted" />
                        <span>{(stats.avgDurationMs / 1000).toFixed(1)}s</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Usage Chart */}
      {dailyUsage && dailyUsage.length > 0 && (
        <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4">الاستخدام اليومي</h3>
          <div className="space-y-2">
            {dailyUsage.map((day: any) => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="text-xs text-muted w-20 shrink-0 font-mono">
                  {day.date.slice(5)}
                </span>
                <div className="flex-1 h-6 bg-surface-2/50 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-l from-primary to-primary/60 rounded-lg transition-all duration-300"
                    style={{ width: `${(day.requests / maxDailyRequests) * 100}%` }}
                  />
                  {day.failures > 0 && (
                    <div
                      className="absolute top-0 h-full bg-destructive/40 rounded-lg"
                      style={{
                        width: `${(day.failures / maxDailyRequests) * 100}%`,
                        right: `${((day.requests - day.failures) / maxDailyRequests) * 100}%`,
                      }}
                    />
                  )}
                </div>
                <span className="text-xs font-bold w-8 text-left">{day.requests}</span>
                <span className="text-xs text-muted w-16 text-left">${day.cost.toFixed(3)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary rounded" />
              <span>طلبات ناجحة</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-destructive/40 rounded" />
              <span>فاشلة</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {overview.totalRequests === 0 && (
        <div className="bg-surface-1 border border-card-border rounded-2xl p-12 text-center">
          <Brain size={48} className="text-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">لا توجد بيانات</h3>
          <p className="text-muted">لم يتم تسجيل أي طلبات AI في الفترة المحددة.</p>
        </div>
      )}
    </div>
  );
}
