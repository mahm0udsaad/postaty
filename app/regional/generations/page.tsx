"use client";

import useSWR from "swr";
import {
  ImageIcon,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
} from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("API error");
    return r.json();
  });

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: "مطاعم",
  supermarket: "سوبرماركت",
  ecommerce: "تجارة إلكترونية",
  services: "خدمات",
  fashion: "أزياء",
  beauty: "تجميل",
  online: "أونلاين",
};

const STATUS_LABELS: Record<string, string> = {
  complete: "مكتمل",
  failed: "فشل",
  processing: "قيد المعالجة",
  queued: "في الانتظار",
  partial: "جزئي",
};

const TYPE_LABELS: Record<string, string> = {
  poster: "تصميم",
  reel: "فيديو",
  menu: "قائمة",
};

interface GenerationsData {
  periodDays: number;
  summary: {
    totalAll: number;
    totalPeriod: number;
    completed: number;
    failed: number;
    totalCredits: number;
  };
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  dailyTrend: Record<string, number>;
  recent: Array<{
    id: string;
    category: string;
    generation_type: string;
    business_name: string;
    product_name: string;
    status: string;
    credits_charged: number;
    created_at: number;
    user_name: string;
    user_email: string;
  }>;
}

export default function RegionalGenerationsPage() {
  const { data, isLoading } = useSWR<GenerationsData>(
    "/api/regional/generations?periodDays=30",
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

  const { summary, byCategory, byType, recent } = data;

  return (
    <div dir="rtl" className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground mb-1 flex items-center gap-2">
          <ImageIcon size={24} className="text-orange-500" />
          التوليدات
        </h1>
        <p className="text-muted text-sm">
          تحليلات آخر 30 يوم — إجمالي {summary.totalAll} توليد
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          icon={BarChart3}
          label="توليدات الفترة"
          value={summary.totalPeriod}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <SummaryCard
          icon={CheckCircle}
          label="مكتملة"
          value={summary.completed}
          color="text-green-500"
          bgColor="bg-green-500/10"
        />
        <SummaryCard
          icon={XCircle}
          label="فاشلة"
          value={summary.failed}
          color="text-red-500"
          bgColor="bg-red-500/10"
        />
        <SummaryCard
          icon={Zap}
          label="كريدت مستخدم"
          value={summary.totalCredits}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
        />
      </div>

      {/* By Category */}
      <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-primary" />
          حسب الفئة
        </h3>
        {Object.keys(byCategory).length === 0 ? (
          <p className="text-sm text-muted">لا توجد توليدات في هذه الفترة</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => {
                const maxCount = Math.max(
                  ...Object.values(byCategory)
                );
                return (
                  <div
                    key={cat}
                    className="bg-surface-2/50 rounded-xl p-4"
                  >
                    <p className="text-xs text-muted mb-1">
                      {CATEGORY_LABELS[cat] || cat}
                    </p>
                    <p className="text-xl font-black text-foreground">
                      {count}
                    </p>
                    <div className="w-full h-1.5 bg-surface-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${
                            maxCount > 0 ? (count / maxCount) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* By Type */}
      <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-amber-500" />
          حسب النوع
        </h3>
        {Object.keys(byType || {}).length === 0 ? (
          <p className="text-sm text-muted">لا توجد توليدات في هذه الفترة</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(byType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const maxCount = Math.max(...Object.values(byType));
                const barColor = type === "menu" ? "bg-amber-500" : type === "reel" ? "bg-purple-500" : "bg-blue-500";
                return (
                  <div key={type} className="bg-surface-2/50 rounded-xl p-4">
                    <p className="text-xs text-muted mb-1">
                      {TYPE_LABELS[type] || type}
                    </p>
                    <p className="text-xl font-black text-foreground">{count}</p>
                    <div className="w-full h-1.5 bg-surface-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full`}
                        style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Recent Generations */}
      <div className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-card-border">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <ImageIcon size={18} className="text-orange-500" />
            آخر التوليدات
          </h3>
        </div>
        {recent.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <ImageIcon size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">لا توجد توليدات</p>
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
                    النشاط التجاري
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
                {recent.map((gen) => (
                  <tr
                    key={gen.id}
                    className="border-t border-card-border hover:bg-surface-2/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{gen.user_name}</p>
                        <p className="text-xs text-muted">{gen.user_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {gen.business_name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 bg-surface-2 rounded-full text-xs font-medium">
                        {CATEGORY_LABELS[gen.category] || gen.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        gen.generation_type === "menu" ? "bg-amber-500/10 text-amber-500" :
                        gen.generation_type === "reel" ? "bg-purple-500/10 text-purple-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        {TYPE_LABELS[gen.generation_type] || gen.generation_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={gen.status} />
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {gen.credits_charged}
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {new Date(gen.created_at).toLocaleDateString("ar-JO-u-nu-latn")}
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    complete: "bg-green-500/10 text-green-500",
    failed: "bg-red-500/10 text-red-500",
    processing: "bg-yellow-500/10 text-yellow-500",
    queued: "bg-blue-500/10 text-blue-500",
    partial: "bg-orange-500/10 text-orange-500",
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
