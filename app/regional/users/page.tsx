"use client";

import useSWR from "swr";
import { Users, Loader2, Search } from "lucide-react";
import { useState, useMemo } from "react";

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

const PLAN_LABELS: Record<string, string> = {
  none: "مجاني",
  starter: "ستارتر",
  growth: "نمو",
  dominant: "دومينانت",
};

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  suspended: "معلق",
  banned: "محظور",
};

interface RegionalUser {
  id: string;
  auth_id: string;
  email: string;
  name: string;
  detected_country: string;
  status: string;
  created_at: number;
  billing: {
    plan_key: string;
    status: string;
    monthly_credits_used: number;
    monthly_credit_limit: number;
    addon_credits_balance: number;
  } | null;
}

export default function RegionalUsersPage() {
  const { data, isLoading } = useSWR<{ users: RegionalUser[]; total: number }>(
    "/api/regional/users?limit=500",
    fetcher
  );
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    if (!search.trim()) return data.users;
    const q = search.toLowerCase();
    return data.users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [data?.users, search]);

  if (isLoading) {
    return (
      <div dir="rtl" className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1 flex items-center gap-2">
            <Users size={24} className="text-blue-500" />
            المستخدمون
          </h1>
          <p className="text-muted text-sm">
            {data?.total || 0} مستخدم من المنطقة
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد..."
            className="w-full pr-10 pl-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {search ? "لا توجد نتائج مطابقة" : "لا يوجد مستخدمون"}
            </p>
          </div>
        ) : (
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
                    الدولة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الخطة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    حالة الاشتراك
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الكريدت
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الحالة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    تاريخ التسجيل
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-card-border hover:bg-surface-2/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-muted">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 bg-surface-2 rounded-full text-xs font-medium">
                        {COUNTRY_LABELS[user.detected_country] ||
                          user.detected_country}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <PlanBadge plan={user.billing?.plan_key || "none"} />
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {user.billing?.status || "—"}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {user.billing
                        ? `${user.billing.monthly_credits_used}/${user.billing.monthly_credit_limit}`
                        : "—"}
                      {user.billing?.addon_credits_balance
                        ? ` (+${user.billing.addon_credits_balance})`
                        : ""}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.status === "active"
                            ? "bg-green-500/10 text-green-500"
                            : user.status === "banned"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}
                      >
                        {STATUS_LABELS[user.status] || user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {new Date(user.created_at).toLocaleDateString("ar-JO-u-nu-latn")}
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
