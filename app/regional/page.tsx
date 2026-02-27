"use client";

import useSWR from "swr";
import {
  Users,
  CreditCard,
  ImageIcon,
  UserPlus,
  Loader2,
  TrendingUp,
} from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("API error");
    return r.json();
  });

const COUNTRY_LABELS: Record<string, string> = {
  JO: "الأردن",
  PS: "فلسطين",
  IL: "إسرائيل",
};

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: "مطاعم",
  supermarket: "سوبرماركت",
  ecommerce: "تجارة إلكترونية",
  services: "خدمات",
  fashion: "أزياء",
  beauty: "تجميل",
  online: "أونلاين",
};

const TYPE_LABELS: Record<string, string> = {
  poster: "تصميم",
  reel: "فيديو",
  menu: "قائمة",
};

const TYPE_COLORS: Record<string, string> = {
  poster: "bg-blue-500",
  reel: "bg-purple-500",
  menu: "bg-amber-500",
};

const PLAN_LABELS: Record<string, string> = {
  none: "مجاني",
  starter: "ستارتر",
  growth: "نمو",
  dominant: "دومينانت",
};

export default function RegionalOverviewPage() {
  const { data, isLoading } = useSWR("/api/regional/overview?periodDays=30", fetcher);

  if (isLoading) {
    return (
      <div dir="rtl" className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!data) return null;

  const { users, subscriptions, generations } = data;

  return (
    <div dir="rtl" className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground mb-1">نظرة عامة</h1>
        <p className="text-muted text-sm">
          تحليلات آخر 30 يوم — الأردن، فلسطين، إسرائيل
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="إجمالي المستخدمين"
          value={users.total}
          color="text-blue-500"
        />
        <KpiCard
          icon={UserPlus}
          label="مستخدمون جدد"
          value={users.new}
          subtitle="آخر 30 يوم"
          color="text-green-500"
        />
        <KpiCard
          icon={CreditCard}
          label="اشتراكات نشطة"
          value={subscriptions.active}
          color="text-purple-500"
        />
        <KpiCard
          icon={ImageIcon}
          label="إجمالي التوليدات"
          value={generations.total}
          color="text-orange-500"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Users by Country */}
        <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            المستخدمون حسب الدولة
          </h3>
          <div className="space-y-3">
            {Object.entries(users.byCountry || {}).map(([code, count]) => (
              <div
                key={code}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-muted">
                  {COUNTRY_LABELS[code] || code}
                </span>
                <span className="font-bold text-foreground">
                  {count as number}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-purple-500" />
            توزيع الخطط
          </h3>
          <div className="space-y-3">
            {Object.entries(subscriptions.planDistribution || {}).map(
              ([plan, count]) => (
                <div
                  key={plan}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-muted">
                    {PLAN_LABELS[plan] || plan}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${
                            users.total > 0
                              ? ((count as number) / users.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="font-bold text-foreground text-sm w-8 text-left">
                      {count as number}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Generations by Category */}
        <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <ImageIcon size={18} className="text-orange-500" />
            التوليدات حسب الفئة
          </h3>
          {Object.keys(generations.byCategory || {}).length === 0 ? (
            <p className="text-sm text-muted">لا توجد توليدات بعد</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(generations.byCategory || {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([cat, count]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted">
                      {CATEGORY_LABELS[cat] || cat}
                    </span>
                    <span className="font-bold text-foreground">
                      {count as number}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Generations by Type */}
        <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <ImageIcon size={18} className="text-amber-500" />
            التوليدات حسب النوع
          </h3>
          {Object.keys(generations.byType || {}).length === 0 ? (
            <p className="text-sm text-muted">لا توجد توليدات بعد</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(generations.byType || {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${TYPE_COLORS[type] || "bg-surface-2"}`} />
                      <span className="text-sm text-muted">
                        {TYPE_LABELS[type] || type}
                      </span>
                    </div>
                    <span className="font-bold text-foreground">
                      {count as number}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Subscription Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="اشتراكات تجريبية"
          value={subscriptions.trialing}
          color="text-yellow-500"
        />
        <StatCard
          label="اشتراكات ملغاة"
          value={subscriptions.canceled}
          color="text-red-500"
        />
        <StatCard
          label="رصيد مستخدم"
          value={generations.totalCreditsUsed}
          suffix="كريدت"
          color="text-emerald-500"
        />
      </div>

      {/* Recent Generations */}
      {generations.recent?.length > 0 && (
        <div className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-card-border">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              آخر التوليدات
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2/50">
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    المستخدم
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الفئة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    النوع
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الحالة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الكريدت
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    التاريخ
                  </th>
                </tr>
              </thead>
              <tbody>
                {generations.recent.map(
                  (g: {
                    id: string;
                    user_name: string;
                    category: string;
                    generation_type: string;
                    status: string;
                    credits_charged: number;
                    created_at: number;
                  }) => (
                    <tr
                      key={g.id}
                      className="border-t border-card-border hover:bg-surface-2/30"
                    >
                      <td className="px-6 py-3 font-medium">
                        {g.user_name}
                      </td>
                      <td className="px-6 py-3 text-muted">
                        {CATEGORY_LABELS[g.category] || g.category}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          g.generation_type === "menu" ? "bg-amber-500/10 text-amber-500" :
                          g.generation_type === "reel" ? "bg-purple-500/10 text-purple-500" :
                          "bg-blue-500/10 text-blue-500"
                        }`}>
                          {TYPE_LABELS[g.generation_type] || g.generation_type}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={g.status} />
                      </td>
                      <td className="px-6 py-3 text-muted">
                        {g.credits_charged}
                      </td>
                      <td className="px-6 py-3 text-muted">
                        {new Date(g.created_at).toLocaleDateString("ar-JO-u-nu-latn")}
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
  subtitle,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  subtitle?: string;
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
      {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number;
  suffix?: string;
  color: string;
}) {
  return (
    <div className="bg-surface-1 border border-card-border rounded-2xl p-5">
      <p className="text-sm text-muted mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>
        {value}
        {suffix && (
          <span className="text-sm font-normal text-muted mr-1">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    complete: "bg-green-500/10 text-green-500",
    failed: "bg-red-500/10 text-red-500",
    processing: "bg-yellow-500/10 text-yellow-500",
    queued: "bg-blue-500/10 text-blue-500",
    partial: "bg-orange-500/10 text-orange-500",
  };
  const labels: Record<string, string> = {
    complete: "مكتمل",
    failed: "فشل",
    processing: "قيد المعالجة",
    queued: "في الانتظار",
    partial: "جزئي",
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || "bg-surface-2 text-muted"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
