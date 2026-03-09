"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Handshake,
  UserPlus,
  Loader2,
  Search,
  AlertCircle,
  ShieldCheck,
  Copy,
  Check,
  Ban,
  ExternalLink,
} from "lucide-react";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("API error");
    return r.json();
  });

interface Partner {
  id: string;
  user_auth_id: string;
  referral_code: string;
  status: string;
  email: string;
  name: string;
  referral_count: number;
  created_at: number;
}

export default function AdminPartnersPage() {
  const { data, isLoading, mutate } = useSWR<{ partners: Partner[] }>(
    "/api/admin/partners",
    fetcher
  );

  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [disabling, setDisabling] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function handleCreate() {
    if (!email.trim()) return;
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "حدث خطأ");
        return;
      }

      setSuccess(
        result.message ||
          `تم إنشاء شريك: ${result.partner.email} — الكود: ${result.partner.referral_code}`
      );
      setEmail("");
      mutate();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setCreating(false);
    }
  }

  async function handleDisable(partnerId: string) {
    setDisabling(partnerId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        `/api/admin/partners?partnerId=${partnerId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "حدث خطأ");
        return;
      }

      setSuccess("تم تعطيل الشريك");
      mutate();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setDisabling(null);
    }
  }

  function handleCopyLink(code: string) {
    const link = `https://postaty.com/?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div dir="rtl" className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Handshake size={28} className="text-primary" />
          <h1 className="text-2xl font-black text-foreground">
            إدارة الشركاء
          </h1>
        </div>
        <p className="text-muted text-sm">
          إنشاء روابط إحالة للشركاء وتتبع أدائهم
        </p>
      </div>

      {/* Create partner form */}
      <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <UserPlus size={20} />
          إنشاء شريك جديد
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
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="أدخل البريد الإلكتروني للمستخدم..."
              className="w-full pr-10 pl-4 py-3 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !email.trim()}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <UserPlus size={16} />
            )}
            إنشاء شريك
          </button>
        </div>

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

      {/* Partners list */}
      <div className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-card-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Handshake size={20} />
            الشركاء
            {data?.partners && (
              <span className="text-sm font-normal text-muted">
                ({data.partners.length})
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
        ) : !data?.partners?.length ? (
          <div className="p-12 text-center text-muted">
            <Handshake size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">لا يوجد شركاء حالياً</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2/50">
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الشريك
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    البريد
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    رابط الإحالة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    لوحة الشريك
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الإحالات
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    الحالة
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    تاريخ الإنشاء
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.partners.map((partner) => (
                  <tr
                    key={partner.id}
                    className="border-t border-card-border hover:bg-surface-2/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{partner.name}</td>
                    <td className="px-6 py-4 text-muted">{partner.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-surface-2 px-2 py-1 rounded text-xs font-mono max-w-[280px] truncate block" dir="ltr">
                          https://postaty.com/?ref={partner.referral_code}
                        </code>
                        <button
                          onClick={() =>
                            handleCopyLink(partner.referral_code)
                          }
                          className="text-muted hover:text-foreground shrink-0"
                          title="نسخ الرابط"
                        >
                          {copiedCode === partner.referral_code ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href="/partner"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                      >
                        <ExternalLink size={12} />
                        فتح اللوحة
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold">
                        {partner.referral_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          partner.status === "active"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {partner.status === "active" ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {new Date(partner.created_at).toLocaleDateString(
                        "ar-JO-u-nu-latn"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {partner.status === "active" && (
                        <button
                          onClick={() => handleDisable(partner.id)}
                          disabled={disabling === partner.id}
                          className="flex items-center gap-1.5 text-red-500 hover:text-red-600 text-sm font-medium disabled:opacity-50"
                        >
                          {disabling === partner.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Ban size={14} />
                          )}
                          تعطيل
                        </button>
                      )}
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
