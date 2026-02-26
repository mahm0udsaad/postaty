"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Globe,
  UserPlus,
  Trash2,
  Loader2,
  Search,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("API error");
    return r.json();
  });

interface Grant {
  id: string;
  user_auth_id: string;
  email: string;
  name: string;
  granted_by_name: string;
  created_at: number;
}

export default function AdminRegionalPage() {
  const {
    data,
    isLoading,
    mutate,
  } = useSWR<{ grants: Grant[] }>("/api/admin/regional-access", fetcher);

  const [email, setEmail] = useState("");
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleGrant() {
    if (!email.trim()) return;
    setGranting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/regional-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "حدث خطأ");
        return;
      }

      setSuccess(`تم منح الصلاحية لـ ${result.grant.email}`);
      setEmail("");
      mutate();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setGranting(false);
    }
  }

  async function handleRevoke(grantId: string) {
    setRevoking(grantId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `/api/admin/regional-access?grantId=${grantId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "حدث خطأ");
        return;
      }

      setSuccess("تم إلغاء الصلاحية");
      mutate();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div dir="rtl" className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Globe size={28} className="text-primary" />
          <h1 className="text-2xl font-black text-foreground">
            إدارة اللوحة الإقليمية
          </h1>
        </div>
        <p className="text-muted text-sm">
          إدارة صلاحيات الوصول إلى لوحة التحليلات الإقليمية (الأردن - فلسطين -
          إسرائيل)
        </p>
      </div>

      {/* Grant access form */}
      <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <UserPlus size={20} />
          منح صلاحية جديدة
        </h2>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGrant()}
              placeholder="أدخل البريد الإلكتروني للمستخدم..."
              className="w-full pr-10 pl-4 py-3 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={handleGrant}
            disabled={granting || !email.trim()}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {granting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <UserPlus size={16} />
            )}
            منح الصلاحية
          </button>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 flex items-center gap-2 text-green-500 text-sm">
            <ShieldCheck size={16} />
            {success}
          </div>
        )}
      </div>

      {/* Grants list */}
      <div className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-card-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck size={20} />
            المستخدمون ذوو الصلاحية
            {data?.grants && (
              <span className="text-sm font-normal text-muted">
                ({data.grants.length})
              </span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2
              size={24}
              className="animate-spin text-muted mx-auto mb-2"
            />
            <p className="text-muted text-sm">جاري التحميل...</p>
          </div>
        ) : !data?.grants?.length ? (
          <div className="p-12 text-center text-muted">
            <Globe size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">لا يوجد مستخدمون لديهم صلاحية حالياً</p>
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
                    البريد الإلكتروني
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    مُنح بواسطة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    تاريخ المنح
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.grants.map((grant) => (
                  <tr
                    key={grant.id}
                    className="border-t border-card-border hover:bg-surface-2/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{grant.name}</td>
                    <td className="px-6 py-4 text-muted">{grant.email}</td>
                    <td className="px-6 py-4 text-muted">
                      {grant.granted_by_name}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {new Date(grant.created_at).toLocaleDateString("ar-JO")}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRevoke(grant.id)}
                        disabled={revoking === grant.id}
                        className="flex items-center gap-1.5 text-red-500 hover:text-red-600 text-sm font-medium disabled:opacity-50"
                      >
                        {revoking === grant.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        إلغاء
                      </button>
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
