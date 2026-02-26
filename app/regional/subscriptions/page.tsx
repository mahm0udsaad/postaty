"use client";

import useSWR from "swr";
import {
  CreditCard,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("API error");
    return r.json();
  });

const PLAN_LABELS: Record<string, string> = {
  none: "مجاني",
  starter: "ستارتر",
  growth: "نمو",
  dominant: "دومينانت",
};

const STATUS_LABELS: Record<string, string> = {
  none: "بدون",
  active: "نشط",
  trialing: "تجريبي",
  past_due: "متأخر",
  canceled: "ملغي",
  unpaid: "غير مدفوع",
  incomplete: "غير مكتمل",
  incomplete_expired: "منتهي",
};

const COUNTRY_LABELS: Record<string, string> = {
  JO: "الأردن",
  PS: "فلسطين",
  IL: "إسرائيل",
};

interface SubscriptionData {
  subscriptions: Array<{
    id: string;
    user_auth_id: string;
    user_email: string;
    user_name: string;
    user_country: string;
    plan_key: string;
    status: string;
    monthly_credit_limit: number;
    monthly_credits_used: number;
    addon_credits_balance: number;
    current_period_start: number | null;
    current_period_end: number | null;
    created_at: number;
  }>;
  summary: {
    total: number;
    active: number;
    trialing: number;
    canceled: number;
    pastDue: number;
    byPlan: Record<string, number>;
  };
}

export default function RegionalSubscriptionsPage() {
  const { data, isLoading } = useSWR<SubscriptionData>(
    "/api/regional/subscriptions",
    fetcher
  );

  if (isLoading) {
    return (
      <div dir="rtl" className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!data) return null;

  const { subscriptions, summary } = data;

  return (
    <div dir="rtl" className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground mb-1 flex items-center gap-2">
          <CreditCard size={24} className="text-purple-500" />
          الاشتراكات
        </h1>
        <p className="text-muted text-sm">
          {summary.total} اشتراك من المنطقة
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          icon={CheckCircle}
          label="نشط"
          value={summary.active}
          color="text-green-500"
          bgColor="bg-green-500/10"
        />
        <SummaryCard
          icon={Clock}
          label="تجريبي"
          value={summary.trialing}
          color="text-yellow-500"
          bgColor="bg-yellow-500/10"
        />
        <SummaryCard
          icon={XCircle}
          label="ملغي"
          value={summary.canceled}
          color="text-red-500"
          bgColor="bg-red-500/10"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="متأخر"
          value={summary.pastDue}
          color="text-orange-500"
          bgColor="bg-orange-500/10"
        />
      </div>

      {/* Plan Distribution */}
      <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-4">توزيع الخطط</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(summary.byPlan).map(([plan, count]) => (
            <div
              key={plan}
              className="bg-surface-2/50 rounded-xl p-4 text-center"
            >
              <p className="text-2xl font-black text-foreground">{count}</p>
              <p className="text-xs text-muted mt-1">
                {PLAN_LABELS[plan] || plan}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-card-border">
          <h3 className="font-bold text-foreground">قائمة الاشتراكات</h3>
        </div>
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <CreditCard size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">لا توجد اشتراكات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2/50">
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    المستخدم
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الدولة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الخطة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الحالة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الكريدت
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    فترة الاشتراك
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-t border-card-border hover:bg-surface-2/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{sub.user_name}</p>
                        <p className="text-xs text-muted">{sub.user_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {COUNTRY_LABELS[sub.user_country] || sub.user_country}
                    </td>
                    <td className="px-6 py-4">
                      <PlanBadge plan={sub.plan_key} />
                    </td>
                    <td className="px-6 py-4">
                      <SubscriptionStatusBadge status={sub.status} />
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {sub.monthly_credits_used}/{sub.monthly_credit_limit}
                      {sub.addon_credits_balance > 0 &&
                        ` (+${sub.addon_credits_balance})`}
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {sub.current_period_end
                        ? `حتى ${new Date(
                            sub.current_period_end
                          ).toLocaleDateString("ar-JO")}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: typeof CheckCircle;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-surface-1 border border-card-border rounded-2xl p-5">
      <div className={`inline-flex p-2 rounded-xl ${bgColor} mb-3`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    none: "bg-surface-2 text-muted",
    starter: "bg-blue-500/10 text-blue-500",
    growth: "bg-purple-500/10 text-purple-500",
    dominant: "bg-amber-500/10 text-amber-500",
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[plan] || "bg-surface-2 text-muted"
      }`}
    >
      {PLAN_LABELS[plan] || plan}
    </span>
  );
}

function SubscriptionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/10 text-green-500",
    trialing: "bg-yellow-500/10 text-yellow-500",
    past_due: "bg-orange-500/10 text-orange-500",
    canceled: "bg-red-500/10 text-red-500",
    none: "bg-surface-2 text-muted",
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || "bg-surface-2 text-muted"
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
