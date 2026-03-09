"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Smartphone,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  ChevronDown,
} from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("API error");
    return r.json();
  });

interface VodafoneRequest {
  id: string;
  user_auth_id: string;
  user_email: string;
  user_name: string;
  phone_number: string;
  plan_key: string | null;
  addon_key: string | null;
  amount_egp: number;
  receipt_url: string;
  status: string;
  admin_notes: string | null;
  subscription_start: number | null;
  subscription_end: number | null;
  created_at: number;
}

type FilterTab = "all" | "pending" | "approved" | "rejected";

const PLAN_OPTIONS = [
  { key: "starter", label: "Starter — 150 رصيد" },
  { key: "growth", label: "Growth — 350 رصيد" },
  { key: "dominant", label: "Dominant — 700 رصيد" },
];

const ADDON_OPTIONS = [
  { key: "addon_5", label: "50 رصيد إضافي" },
  { key: "addon_10", label: "100 رصيد إضافي" },
];

export default function AdminVodafoneRequestsPage() {
  const { data, isLoading, mutate } = useSWR<{
    requests: VodafoneRequest[];
    summary: { pending: number; approved: number; rejected: number; total: number };
  }>("/api/admin/vodafone-requests", fetcher);

  const [filter, setFilter] = useState<FilterTab>("pending");
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // Per-request action state
  const [actionState, setActionState] = useState<
    Record<string, { type: "approve" | "reject"; planKey?: string; addonKey?: string; notes?: string }>
  >({});

  function getActionState(id: string) {
    return actionState[id] || { type: "approve" };
  }

  function updateActionState(id: string, updates: Partial<(typeof actionState)[string]>) {
    setActionState((prev) => ({
      ...prev,
      [id]: { ...getActionState(id), ...updates },
    }));
  }

  async function handleAction(requestId: string) {
    const state = getActionState(requestId);
    setProcessing(requestId);
    setError("");
    setSuccess("");

    try {
      const body: Record<string, unknown> = {
        requestId,
        action: state.type,
      };

      if (state.type === "approve") {
        if (!state.planKey && !state.addonKey) {
          setError("اختر خطة أو أرصدة إضافية للموافقة");
          setProcessing(null);
          return;
        }
        if (state.planKey) body.planKey = state.planKey;
        if (state.addonKey) body.addonKey = state.addonKey;
      }

      if (state.notes) body.adminNotes = state.notes;

      const res = await fetch("/api/admin/vodafone-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "حدث خطأ");
        return;
      }

      setSuccess(state.type === "approve" ? "تمت الموافقة بنجاح" : "تم الرفض");
      mutate();

      // Clean up action state
      setActionState((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setProcessing(null);
    }
  }

  const filtered =
    data?.requests?.filter((r) => (filter === "all" ? true : r.status === filter)) || [];

  return (
    <div dir="rtl" className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Smartphone size={28} className="text-red-500" />
          <h1 className="text-2xl font-black text-foreground">طلبات فودافون كاش</h1>
          {data?.summary?.pending ? (
            <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-bold">
              {data.summary.pending} معلق
            </span>
          ) : null}
        </div>
        <p className="text-muted text-sm">مراجعة طلبات الدفع عبر فودافون كاش والموافقة عليها</p>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "الكل", value: data.summary.total, color: "text-foreground" },
            { label: "معلقة", value: data.summary.pending, color: "text-yellow-500" },
            { label: "مقبولة", value: data.summary.approved, color: "text-green-500" },
            { label: "مرفوضة", value: data.summary.rejected, color: "text-red-500" },
          ].map((item) => (
            <div key={item.label} className="bg-surface-1 border border-card-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
              <div className="text-xs text-muted mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["pending", "all", "approved", "rejected"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted hover:text-foreground hover:bg-surface-2"
            }`}
          >
            {tab === "all" && "الكل"}
            {tab === "pending" && "معلقة"}
            {tab === "approved" && "مقبولة"}
            {tab === "rejected" && "مرفوضة"}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-xl">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-green-500 text-sm bg-green-500/10 p-3 rounded-xl">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {/* Requests List */}
      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 size={24} className="animate-spin text-muted mx-auto mb-2" />
          <p className="text-muted text-sm">جاري التحميل...</p>
        </div>
      ) : !filtered.length ? (
        <div className="bg-surface-1 border border-card-border rounded-2xl p-12 text-center text-muted">
          <Smartphone size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">لا توجد طلبات {filter !== "all" ? `(${filter})` : ""}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden"
            >
              {/* Request Header */}
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold">{req.user_name || "—"}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted">
                    <div>
                      <span className="font-medium text-foreground/70">البريد: </span>
                      {req.user_email}
                    </div>
                    <div>
                      <span className="font-medium text-foreground/70">الهاتف: </span>
                      <span dir="ltr">{req.phone_number}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground/70">المبلغ: </span>
                      <span dir="ltr" className="font-bold text-red-500">{req.amount_egp} EGP</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted mt-2">
                    {new Date(req.created_at).toLocaleString("ar-EG-u-nu-latn")}
                    {req.subscription_end && (
                      <span className="mr-4">
                        ينتهي: {new Date(req.subscription_end).toLocaleDateString("ar-EG-u-nu-latn")}
                      </span>
                    )}
                  </div>
                  {req.admin_notes && (
                    <div className="mt-2 text-sm bg-surface-2 p-2 rounded-lg">
                      <span className="font-medium">ملاحظات: </span>{req.admin_notes}
                    </div>
                  )}
                </div>

                {/* Receipt */}
                <button
                  onClick={() => setViewingReceipt(viewingReceipt === req.id ? null : req.id)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-surface-2 rounded-lg text-xs font-medium hover:bg-surface-2/80 transition-colors"
                >
                  <Eye size={14} />
                  الإيصال
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${viewingReceipt === req.id ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {/* Receipt Image */}
              {viewingReceipt === req.id && (
                <div className="px-5 pb-4">
                  <img
                    src={req.receipt_url}
                    alt="Receipt"
                    className="max-h-96 rounded-xl border border-card-border object-contain mx-auto"
                  />
                </div>
              )}

              {/* Actions (only for pending) */}
              {req.status === "pending" && (
                <div className="px-5 pb-5 border-t border-card-border pt-4">
                  <div className="flex flex-wrap gap-3 items-end">
                    {/* Plan selector */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs text-muted mb-1 block">الخطة الشهرية</label>
                      <select
                        value={getActionState(req.id).planKey || ""}
                        onChange={(e) =>
                          updateActionState(req.id, {
                            planKey: e.target.value || undefined,
                            addonKey: e.target.value ? undefined : getActionState(req.id).addonKey,
                          })
                        }
                        className="w-full px-3 py-2.5 bg-surface-2 border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">— اختر خطة —</option>
                        {PLAN_OPTIONS.map((p) => (
                          <option key={p.key} value={p.key}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Addon selector */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs text-muted mb-1 block">أو أرصدة إضافية</label>
                      <select
                        value={getActionState(req.id).addonKey || ""}
                        onChange={(e) =>
                          updateActionState(req.id, {
                            addonKey: e.target.value || undefined,
                            planKey: e.target.value ? undefined : getActionState(req.id).planKey,
                          })
                        }
                        className="w-full px-3 py-2.5 bg-surface-2 border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">— اختر إضافة —</option>
                        {ADDON_OPTIONS.map((a) => (
                          <option key={a.key} value={a.key}>{a.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notes */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs text-muted mb-1 block">ملاحظات (اختياري)</label>
                      <input
                        type="text"
                        value={getActionState(req.id).notes || ""}
                        onChange={(e) => updateActionState(req.id, { notes: e.target.value })}
                        placeholder="ملاحظات..."
                        className="w-full px-3 py-2.5 bg-surface-2 border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          updateActionState(req.id, { type: "approve" });
                          handleAction(req.id);
                        }}
                        disabled={
                          processing === req.id ||
                          (!getActionState(req.id).planKey && !getActionState(req.id).addonKey)
                        }
                        className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm disabled:opacity-50 flex items-center gap-2 hover:bg-green-700 transition-colors"
                      >
                        {processing === req.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        موافقة
                      </button>
                      <button
                        onClick={() => {
                          updateActionState(req.id, { type: "reject" });
                          handleAction(req.id);
                        }}
                        disabled={processing === req.id}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-bold text-sm disabled:opacity-50 flex items-center gap-2 hover:bg-red-700 transition-colors"
                      >
                        {processing === req.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <XCircle size={14} />
                        )}
                        رفض
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { icon: Clock, label: "معلق", className: "bg-yellow-500/10 text-yellow-500" },
    approved: { icon: CheckCircle2, label: "مقبول", className: "bg-green-500/10 text-green-500" },
    rejected: { icon: XCircle, label: "مرفوض", className: "bg-red-500/10 text-red-500" },
  }[status] || { icon: Clock, label: status, className: "bg-muted/10 text-muted" };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}
