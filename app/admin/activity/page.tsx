"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import {
  ScrollText,
  Loader2,
  Shield,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("API error");
    return r.json();
  });

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  "user.suspend": "إيقاف مستخدم",
  "user.ban": "حظر مستخدم",
  "user.reinstate": "إعادة تفعيل",
  "user.update_role": "تغيير الدور",
  "credits.add": "إضافة أرصدة",
};

const ACTION_COLORS: Record<string, string> = {
  "user.suspend": "bg-amber-500/20 text-amber-600",
  "user.ban": "bg-red-500/20 text-red-600",
  "user.reinstate": "bg-green-500/20 text-green-600",
  "user.update_role": "bg-primary/20 text-primary",
  "credits.add": "bg-accent/20 text-accent",
};

export default function AdminActivityPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [adminFilter, setAdminFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set("page", String(currentPage));
  queryParams.set("limit", String(PAGE_SIZE));
  if (adminFilter !== "all") queryParams.set("admin_id", adminFilter);
  if (actionFilter !== "all") queryParams.set("action", actionFilter);
  if (dateFrom)
    queryParams.set("date_from", String(new Date(dateFrom).getTime()));
  if (dateTo)
    queryParams.set(
      "date_to",
      String(new Date(dateTo + "T23:59:59").getTime())
    );

  const { data, isLoading } = useSWR(
    `/api/admin/activity?${queryParams.toString()}`,
    fetcher
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(0);
  }, [adminFilter, actionFilter, dateFrom, dateTo]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  const { logs, total, adminUsers, actionTypes } = data;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">سجل النشاط</h1>
        <p className="text-muted">عرض جميع إجراءات المسؤولين</p>
      </div>

      {/* Admin Users Summary */}
      <div className="bg-surface-1 border border-card-border rounded-2xl p-6 mb-6">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Shield size={18} className="text-primary" />
          المسؤولون
        </h3>
        <div className="flex flex-wrap gap-3">
          {adminUsers.map((admin: any) => (
            <div
              key={admin.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm"
            >
              {admin.role === "owner" ? (
                <Crown size={14} className="text-accent" />
              ) : (
                <Shield size={14} className="text-primary" />
              )}
              <span className="font-bold">{admin.name}</span>
              <span className="text-xs text-muted">{admin.email}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  admin.role === "owner"
                    ? "bg-accent/20 text-accent"
                    : "bg-primary/20 text-primary"
                }`}
              >
                {admin.role === "owner" ? "مالك" : "مسؤول"}
              </span>
            </div>
          ))}
          {adminUsers.length === 0 && (
            <p className="text-sm text-muted">لا يوجد مسؤولون</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <select
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value)}
          className="w-full px-3 py-3 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">كل المسؤولين</option>
          {adminUsers.map((a: any) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full px-3 py-3 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">كل الإجراءات</option>
          {actionTypes.map((action: string) => (
            <option key={action} value={action}>
              {ACTION_LABELS[action] || action}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full px-3 py-3 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="من تاريخ"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full px-3 py-3 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="إلى تاريخ"
        />
      </div>

      {/* Logs Table */}
      {logs.length > 0 ? (
        <div className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-surface-2/30">
                  <th className="text-right py-3 px-4 font-medium text-muted">
                    المسؤول
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted">
                    الإجراء
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted">
                    الهدف
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted">
                    التفاصيل
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted">
                    التاريخ
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr
                    key={log.id}
                    className="border-b border-card-border/50 hover:bg-surface-2/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium">{log.admin_name}</div>
                      <div className="text-xs text-muted">
                        {log.admin_email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          ACTION_COLORS[log.action] || "bg-muted/20 text-muted"
                        }`}
                      >
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium">
                        {log.target_name}
                      </span>
                      <div className="text-xs text-muted">
                        {log.resource_type}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted max-w-[200px]">
                      {log.parsed_metadata && (
                        <div className="space-y-0.5">
                          {log.parsed_metadata.reason && (
                            <div>
                              السبب: {log.parsed_metadata.reason}
                            </div>
                          )}
                          {log.parsed_metadata.amount && (
                            <div>
                              الكمية: {log.parsed_metadata.amount}
                            </div>
                          )}
                          {log.parsed_metadata.newRole && (
                            <div>
                              الدور الجديد:{" "}
                              {log.parsed_metadata.newRole === "admin"
                                ? "مسؤول"
                                : log.parsed_metadata.newRole === "member"
                                  ? "عضو"
                                  : log.parsed_metadata.newRole}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString("ar-SA")}
                      <br />
                      {new Date(log.created_at).toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-card-border">
              <span className="text-xs text-muted">
                عرض {currentPage * PAGE_SIZE + 1}–
                {Math.min((currentPage + 1) * PAGE_SIZE, total)} من {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
                <span className="text-sm font-medium min-w-[4rem] text-center">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface-1 border border-card-border rounded-2xl p-12 text-center">
          <ScrollText size={48} className="text-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">لا توجد سجلات</h3>
          <p className="text-muted">
            {adminFilter !== "all" ||
            actionFilter !== "all" ||
            dateFrom ||
            dateTo
              ? "حاول تغيير معايير البحث."
              : "ستظهر سجلات الإجراءات هنا عند تنفيذها."}
          </p>
        </div>
      )}
    </div>
  );
}
