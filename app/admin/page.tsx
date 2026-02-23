"use client";

import useSWR from "swr";
import {
  Brain,
  DollarSign,
  Users,
  ThumbsUp,
  TrendingUp,
  Activity,
  ImageIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

export default function AdminDashboard() {
  const { data: overview } = useSWR('/api/admin/overview?periodDays=30', fetcher);
  const { data: feedbackData } = useSWR('/api/admin/feedback', fetcher);
  const { data: usersData } = useSWR('/api/admin/users?limit=5', fetcher);
  const users = usersData?.users;

  const aiOverview = overview?.ai;
  const financialOverview = overview?.financial;
  const feedbackSummary = feedbackData?.summary;

  const isLoading = !overview;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">لوحة التحكم</h1>
        <p className="text-muted">نظرة عامة على أداء النظام - آخر 30 يوم</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-muted" />
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard
              label="إجمالي الطلبات"
              value={aiOverview?.totalRequests ?? 0}
              icon={Activity}
              color="text-primary"
              bgColor="bg-primary/10"
              href="/admin/ai"
            />
            <KpiCard
              label="صافي الأرباح"
              value={`$${(financialOverview?.netProfit ?? 0).toFixed(2)}`}
              icon={DollarSign}
              color="text-success"
              bgColor="bg-success/10"
              href="/admin/finance"
            />
            <KpiCard
              label="الصور المولدة"
              value={aiOverview?.totalImages ?? 0}
              icon={ImageIcon}
              color="text-accent"
              bgColor="bg-accent/10"
              href="/admin/ai"
            />
            <KpiCard
              label="نسبة النجاح"
              value={`${((aiOverview?.successRate ?? 0) * 100).toFixed(1)}%`}
              icon={TrendingUp}
              color="text-primary"
              bgColor="bg-primary/10"
              href="/admin/ai"
            />
          </div>

          {/* Secondary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Financial Summary */}
            <Link
              href="/admin/finance"
              className="bg-surface-1 border border-card-border rounded-2xl p-6 hover:bg-surface-2/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-success/10 rounded-xl">
                  <DollarSign size={20} className="text-success" />
                </div>
                <h3 className="font-bold">المالية</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">الإيرادات</span>
                  <span className="font-bold">${(financialOverview?.grossRevenue ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">تكلفة AI</span>
                  <span className="font-bold text-destructive">-${(financialOverview?.apiCostUsd ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">MRR</span>
                  <span className="font-bold text-primary">${(financialOverview?.mrr ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </Link>

            {/* Users Summary */}
            <Link
              href="/admin/users"
              className="bg-surface-1 border border-card-border rounded-2xl p-6 hover:bg-surface-2/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Users size={20} className="text-primary" />
                </div>
                <h3 className="font-bold">المستخدمون</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">إجمالي المستخدمين</span>
                  <span className="font-bold">{users?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">اشتراكات نشطة</span>
                  <span className="font-bold text-success">{financialOverview?.activeSubscriptions ?? 0}</span>
                </div>
              </div>
            </Link>

            {/* Feedback Summary */}
            <Link
              href="/admin/feedback"
              className="bg-surface-1 border border-card-border rounded-2xl p-6 hover:bg-surface-2/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <ThumbsUp size={20} className="text-accent" />
                </div>
                <h3 className="font-bold">التقييمات</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">إجمالي التقييمات</span>
                  <span className="font-bold">{feedbackSummary?.total ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">نسبة الإعجاب</span>
                  <span className="font-bold text-success">
                    {((feedbackSummary?.likeRate ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">إعجاب / عدم إعجاب</span>
                  <span className="font-bold">
                    {feedbackSummary?.likes ?? 0} / {feedbackSummary?.dislikes ?? 0}
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Users */}
          {users && users.length > 0 && (
            <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">آخر المستخدمين</h3>
                <Link href="/admin/users" className="text-sm text-primary hover:underline font-medium">
                  عرض الكل
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="text-right py-3 px-2 font-medium text-muted">الاسم</th>
                      <th className="text-right py-3 px-2 font-medium text-muted">البريد</th>
                      <th className="text-right py-3 px-2 font-medium text-muted">الخطة</th>
                      <th className="text-right py-3 px-2 font-medium text-muted">التوليدات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((user: any) => (
                      <tr key={user.id} className="border-b border-card-border/50">
                        <td className="py-3 px-2 font-medium">{user.name}</td>
                        <td className="py-3 px-2 text-muted">{user.email}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                            user.billing?.plan_key === "dominant" ? "bg-accent/20 text-accent" :
                            user.billing?.plan_key === "growth" ? "bg-primary/20 text-primary" :
                            user.billing?.plan_key === "starter" ? "bg-success/20 text-success" :
                            "bg-muted/20 text-muted"
                          }`}>
                            {user.billing?.plan_key ?? "مجاني"}
                          </span>
                        </td>
                        <td className="py-3 px-2">{user.totalGenerations ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
  bgColor: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-surface-1 border border-card-border rounded-2xl p-5 hover:bg-surface-2/30 transition-colors group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${bgColor}`}>
          <Icon size={20} className={color} />
        </div>
        <span className="text-sm text-muted font-medium">{label}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
    </Link>
  );
}
