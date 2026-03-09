"use client";

import useSWR from "swr";
import {
  Users,
  UserPlus,
  CreditCard,
  TrendingUp,
  Loader2,
  Link2,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

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

const BILLING_STATUS_LABELS: Record<string, string> = {
  none: "بدون",
  active: "نشط",
  trialing: "تجريبي",
  canceled: "ملغي",
};

export default function PartnerOverviewPage() {
  const { data, isLoading } = useSWR("/api/partner/overview", fetcher);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div dir="rtl" className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!data) return null;

  const {
    referralCode,
    totalReferred,
    freeUsers,
    subscribedUsers,
    conversionRate,
    planBreakdown,
    recentReferrals,
  } = data;

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${referralCode}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div dir="rtl" className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground mb-1">نظرة عامة</h1>
        <p className="text-muted text-sm">تحليلات إحالاتك وأدائك</p>
      </div>

      {/* Referral Link */}
      <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <Link2 size={18} className="text-primary" />
          رابط الإحالة الخاص بك
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-surface-2 border border-card-border rounded-xl px-4 py-3 text-sm font-mono text-foreground truncate" dir="ltr">
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold text-sm shrink-0"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "تم النسخ" : "نسخ"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="إجمالي الإحالات"
          value={totalReferred}
          color="text-blue-500"
        />
        <KpiCard
          icon={UserPlus}
          label="مستخدمون مجانيون"
          value={freeUsers}
          color="text-green-500"
        />
        <KpiCard
          icon={CreditCard}
          label="مشتركون"
          value={subscribedUsers}
          color="text-purple-500"
        />
        <KpiCard
          icon={TrendingUp}
          label="نسبة التحويل"
          value={`${conversionRate}%`}
          color="text-orange-500"
        />
      </div>

      {/* Plan Breakdown */}
      {Object.keys(planBreakdown).length > 0 && (
        <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-purple-500" />
            توزيع الخطط
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(planBreakdown).map(([plan, count]) => (
              <div
                key={plan}
                className="bg-surface-2/50 rounded-xl p-4 text-center"
              >
                <p className="text-2xl font-black text-foreground">
                  {count as number}
                </p>
                <p className="text-xs text-muted mt-1">
                  {PLAN_LABELS[plan] || plan}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Referrals */}
      {recentReferrals?.length > 0 && (
        <div className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-card-border">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              آخر الإحالات
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2/50">
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الاسم
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    البريد
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الخطة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الحالة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    تاريخ الإحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentReferrals.map(
                  (r: {
                    auth_id: string;
                    name: string;
                    email: string;
                    plan_key: string;
                    billing_status: string;
                    referred_at: number;
                  }) => (
                    <tr
                      key={r.auth_id}
                      className="border-t border-card-border hover:bg-surface-2/30"
                    >
                      <td className="px-6 py-3 font-medium">{r.name}</td>
                      <td className="px-6 py-3 text-muted">{r.email}</td>
                      <td className="px-6 py-3">
                        <PlanBadge plan={r.plan_key} />
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={r.billing_status} />
                      </td>
                      <td className="px-6 py-3 text-muted">
                        {new Date(r.referred_at).toLocaleDateString(
                          "ar-JO-u-nu-latn"
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl bg-surface-2 ${color}`}>
          <Icon size={20} />
        </div>
        <span className="text-sm text-muted">{label}</span>
      </div>
      <p className="text-3xl font-black text-foreground">{value}</p>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/10 text-green-500",
    trialing: "bg-yellow-500/10 text-yellow-500",
    canceled: "bg-red-500/10 text-red-500",
    none: "bg-surface-2 text-muted",
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || "bg-surface-2 text-muted"
      }`}
    >
      {BILLING_STATUS_LABELS[status] || status}
    </span>
  );
}
