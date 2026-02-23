"use client";

import useSWR from "swr";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Loader2,
  ArrowDown,
  ArrowUp,
  Minus,
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

export default function AdminFinancePage() {
  const [periodDays, setPeriodDays] = useState(30);
  const { data: overviewData } = useSWR(`/api/admin/overview?periodDays=${periodDays}`, fetcher);
  const overview = overviewData?.financial;

  if (!overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  const profitPositive = overview.netProfit >= 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black mb-2">المالية</h1>
          <p className="text-muted">تحليل الإيرادات والمصروفات والأرباح</p>
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

      {/* Profit Formula */}
      <div className="bg-surface-1 border border-card-border rounded-2xl p-6 mb-8">
        <h3 className="font-bold text-lg mb-4">معادلة الأرباح</h3>
        <div className="flex flex-wrap items-center gap-3 text-lg font-mono justify-center">
          <span className="px-4 py-2 bg-success/10 text-success rounded-xl font-bold">
            ${overview.grossRevenue.toFixed(2)}
          </span>
          <Minus size={20} className="text-muted" />
          <span className="px-4 py-2 bg-destructive/10 text-destructive rounded-xl font-bold">
            ${overview.stripeFees.toFixed(2)}
          </span>
          <Minus size={20} className="text-muted" />
          <span className="px-4 py-2 bg-accent/10 text-accent rounded-xl font-bold">
            ${overview.apiCostUsd.toFixed(4)}
          </span>
          <span className="text-muted">=</span>
          <span className={`px-4 py-2 rounded-xl font-bold ${
            profitPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            ${overview.netProfit.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted justify-center mt-3">
          <span>الإيرادات</span>
          <span>-</span>
          <span>رسوم Stripe</span>
          <span>-</span>
          <span>تكلفة API</span>
          <span>=</span>
          <span>صافي الربح</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="إجمالي الإيرادات"
          value={`$${overview.grossRevenue.toFixed(2)}`}
          description="الإيرادات المسجلة من Stripe (فواتير الاشتراكات والمدفوعات)."
          icon={ArrowUp}
          color="text-success"
          bgColor="bg-success/10"
        />
        <MetricCard
          label={overview.hasActualFees ? "رسوم Stripe الفعلية" : "رسوم Stripe المقدرة"}
          value={`$${overview.stripeFees.toFixed(2)}`}
          description={overview.hasActualFees
            ? "رسوم فعلية من Stripe (balance transaction)."
            : "تقدير بنسبة 2.9% + $0.30 لكل معاملة."
          }
          icon={CreditCard}
          color="text-destructive"
          bgColor="bg-destructive/10"
        />
        <MetricCard
          label="تكلفة API"
          value={`$${overview.apiCostUsd.toFixed(4)}`}
          description="تكلفة استخدام نماذج AI (Gemini) المسجلة من aiUsageEvents."
          icon={ArrowDown}
          color="text-accent"
          bgColor="bg-accent/10"
        />
        <MetricCard
          label="صافي الربح"
          value={`$${overview.netProfit.toFixed(2)}`}
          description="الإيرادات - رسوم Stripe - تكلفة API."
          icon={TrendingUp}
          color={profitPositive ? "text-success" : "text-destructive"}
          bgColor={profitPositive ? "bg-success/10" : "bg-destructive/10"}
        />
      </div>

      {/* Subscriptions & MRR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* MRR */}
        <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <TrendingUp size={20} className="text-primary" />
            </div>
            <h3 className="font-bold">الإيراد الشهري المتكرر (MRR)</h3>
          </div>
          <div className="text-3xl font-black text-primary mb-2">${overview.mrr.toFixed(2)}</div>
          <p className="text-xs text-muted">تقدير بناءً على الاشتراكات النشطة الحالية.</p>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-xl">
              <CreditCard size={20} className="text-accent" />
            </div>
            <h3 className="font-bold">توزيع الاشتراكات</h3>
          </div>
          <div className="space-y-3">
            <DistRow label="أساسي (Basic)" count={overview.subscriptionsByPlan.starter} total={overview.activeSubscriptions} color="bg-success" />
            <DistRow label="احترافي (Pro)" count={overview.subscriptionsByPlan.growth} total={overview.activeSubscriptions} color="bg-primary" />
            <DistRow label="بريميوم (Premium)" count={overview.subscriptionsByPlan.dominant} total={overview.activeSubscriptions} color="bg-accent" />
          </div>
          <div className="mt-4 pt-3 border-t border-card-border flex justify-between">
            <span className="text-sm text-muted">إجمالي الاشتراكات النشطة</span>
            <span className="font-bold">{overview.activeSubscriptions}</span>
          </div>
        </div>
      </div>

      {/* Zero state */}
      {overview.grossRevenue === 0 && overview.apiCostUsd === 0 && (
        <div className="bg-surface-2/30 border border-card-border rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-muted mt-0.5 shrink-0" />
          <div>
            <p className="font-medium mb-1">لا توجد بيانات مالية في هذه الفترة</p>
            <p className="text-sm text-muted">ستظهر البيانات تلقائياً عندما يبدأ المستخدمون بالاشتراك واستخدام النظام.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-surface-1 border border-card-border rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${bgColor}`}>
          <Icon size={20} className={color} />
        </div>
        <span className="text-sm text-muted font-medium">{label}</span>
      </div>
      <div className="text-2xl font-black mb-2">{value}</div>
      <p className="text-xs text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function DistRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted">{label}</span>
        <span className="font-bold">{count}</span>
      </div>
      <div className="h-2 bg-surface-2/50 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
