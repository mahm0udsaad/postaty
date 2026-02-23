"use client";

import useSWR from "swr";
import {
  Users, Loader2, Search, Shield, Crown, Ban, ShieldX, CheckCircle,
  Coins, Bell, MoreHorizontal, UserCog, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

const PAGE_SIZE = 10;

const PLAN_LABELS: Record<string, string> = {
  none: "مجاني",
  starter: "أساسي",
  growth: "احترافي",
  dominant: "بريميوم",
};

const PLAN_COLORS: Record<string, string> = {
  none: "bg-muted/20 text-muted",
  starter: "bg-success/20 text-success",
  growth: "bg-primary/20 text-primary",
  dominant: "bg-accent/20 text-accent",
};

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  trialing: "تجريبي",
  past_due: "متأخر",
  canceled: "ملغي",
  none: "بدون",
};

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  suspended: "موقوف",
  banned: "محظور",
};

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-600",
  suspended: "bg-amber-500/20 text-amber-600",
  banned: "bg-red-500/20 text-red-600",
};

function countryCodeToFlag(countryCode?: string) {
  if (!countryCode || countryCode.length !== 2) return null;
  const upper = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return String.fromCodePoint(
    ...[...upper].map((char) => 127397 + char.charCodeAt(0))
  );
}

// ── Modals ─────────────────────────────────────────────────────────

type ModalUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: string;
};

function ConfirmActionModal({
  user,
  action,
  onClose,
  onSuccess,
}: {
  user: ModalUser;
  action: "suspend" | "ban";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: user.id, reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'حدث خطأ');
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-surface-1 border border-card-border rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {action === "suspend" ? "إيقاف المستخدم" : "حظر المستخدم"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-2 transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted">
          {action === "suspend"
            ? `هل أنت متأكد من إيقاف حساب "${user.name}" مؤقتاً؟`
            : `هل أنت متأكد من حظر حساب "${user.name}" بشكل دائم؟`}
        </p>

        <div>
          <label className="block text-sm font-medium mb-1">السبب *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="اكتب سبب الإجراء..."
            rows={3}
            className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-2 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || loading}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 ${
              action === "ban"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : action === "suspend" ? "إيقاف" : "حظر"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCreditsModal({
  user,
  onClose,
  onSuccess,
}: {
  user: ModalUser;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const num = parseInt(amount, 10);
    if (!num || num <= 0 || !reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_credits', userId: user.id, amount: num, reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'حدث خطأ');
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-surface-1 border border-card-border rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">إضافة أرصدة</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-2 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted">إضافة أرصدة لحساب: <span className="font-bold text-foreground">{user.name}</span></p>

        <div>
          <label className="block text-sm font-medium mb-1">عدد الأرصدة *</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="مثال: 10"
            className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">السبب *</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثال: تعويض عن مشكلة تقنية"
            className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-2 transition-colors">
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!amount || parseInt(amount, 10) <= 0 || !reason.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "إضافة"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SendNotificationModal({
  user,
  onClose,
  onSuccess,
}: {
  user: ModalUser;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"info" | "warning" | "success" | "credit" | "system">("info");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_notification',
          userId: user.id,
          title: title.trim(),
          notificationBody: body.trim(),
          type,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'حدث خطأ');
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-surface-1 border border-card-border rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">إرسال إشعار</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-2 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted">إرسال إشعار إلى: <span className="font-bold text-foreground">{user.name}</span></p>

        <div>
          <label className="block text-sm font-medium mb-1">النوع</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="info">معلومات</option>
            <option value="warning">تحذير</option>
            <option value="success">نجاح</option>
            <option value="credit">أرصدة</option>
            <option value="system">نظام</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">العنوان *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان الإشعار..."
            className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">المحتوى *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="محتوى الإشعار..."
            rows={3}
            className="w-full px-3 py-2 bg-surface-2 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-2 transition-colors">
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !body.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "إرسال"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Manage Role Modal ─────────────────────────────────────────────

function ManageRoleModal({
  user,
  onClose,
  onSuccess,
}: {
  user: ModalUser;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<"admin" | "member">(
    user.role === "owner" ? "admin" : user.role
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (selectedRole === user.role) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_role', userId: user.id, role: selectedRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'حدث خطأ');
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: "admin" as const,
      label: "مسؤول",
      description: "يمكنه الوصول إلى لوحة الإدارة وإدارة المستخدمين",
      icon: <Shield size={18} className="text-primary" />,
      color: "border-primary/50 bg-primary/5",
      selectedColor: "border-primary ring-2 ring-primary/30 bg-primary/10",
    },
    {
      value: "member" as const,
      label: "عضو",
      description: "مستخدم عادي بدون صلاحيات إدارية",
      icon: <Users size={18} className="text-muted" />,
      color: "border-card-border bg-surface-2/30",
      selectedColor: "border-primary ring-2 ring-primary/30 bg-primary/10",
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-surface-1 border border-card-border rounded-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">إدارة الدور</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-2 transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted">
          تغيير دور <span className="font-bold text-foreground">{user.name}</span>
        </p>

        <div className="space-y-2">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              className={`w-full text-right flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                selectedRole === role.value ? role.selectedColor : role.color
              }`}
            >
              {role.icon}
              <div className="flex-1">
                <div className="font-bold text-sm">{role.label}</div>
                <div className="text-xs text-muted">{role.description}</div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selectedRole === role.value ? "border-primary" : "border-muted/40"
              }`}>
                {selectedRole === role.value && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            </button>
          ))}
        </div>

        {selectedRole !== user.role && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-600">
            سيتم تغيير دور المستخدم من{" "}
            <span className="font-bold">{user.role === "admin" ? "مسؤول" : "عضو"}</span>{" "}
            إلى{" "}
            <span className="font-bold">{selectedRole === "admin" ? "مسؤول" : "عضو"}</span>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-2 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedRole === user.role || loading}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Actions Dropdown ──────────────────────────────────────────────

function ActionsDropdown({ user, currentUserId, onMutate }: { user: ModalUser; currentUserId?: string; onMutate: () => void }) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [modal, setModal] = useState<"suspend" | "ban" | "credits" | "notify" | "role" | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isSelf = currentUserId === user.id;
  const isSuspendedOrBanned = (user.status ?? "active") === "suspended" || (user.status ?? "active") === "banned";

  const handleReinstate = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reinstate', userId: user.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'حدث خطأ');
      }
      onMutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "حدث خطأ");
    }
    setOpen(false);
  };

  const toggleMenu = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedMenuHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow);
    }
    setOpen((prev) => !prev);
  };

  return (
    <>
      <div className="relative">
        <button
          ref={triggerRef}
          onClick={toggleMenu}
          className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
        >
          <MoreHorizontal size={16} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div
              className={`absolute left-0 w-48 bg-surface-1 border border-card-border rounded-xl shadow-xl z-40 overflow-hidden max-h-[70vh] overflow-y-auto ${
                openUpward ? "bottom-full mb-1" : "top-full mt-1"
              }`}
            >
              {/* Manage Role */}
              {!isSelf && (
                <button
                  onClick={() => { setModal("role"); setOpen(false); }}
                  className="w-full text-right flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-surface-2 transition-colors"
                >
                  <UserCog size={14} />
                  إدارة الدور
                </button>
              )}

              {/* Suspend / Ban / Reinstate */}
              {!isSelf && isSuspendedOrBanned && (
                <button
                  onClick={handleReinstate}
                  className="w-full text-right flex items-center gap-2 px-3 py-2.5 text-xs text-green-600 hover:bg-green-500/10 transition-colors"
                >
                  <CheckCircle size={14} />
                  إعادة تفعيل
                </button>
              )}
              {!isSelf && !isSuspendedOrBanned && (
                <>
                  <button
                    onClick={() => { setModal("suspend"); setOpen(false); }}
                    className="w-full text-right flex items-center gap-2 px-3 py-2.5 text-xs text-amber-600 hover:bg-amber-500/10 transition-colors"
                  >
                    <ShieldX size={14} />
                    إيقاف مؤقت
                  </button>
                  <button
                    onClick={() => { setModal("ban"); setOpen(false); }}
                    className="w-full text-right flex items-center gap-2 px-3 py-2.5 text-xs text-red-600 hover:bg-red-500/10 transition-colors"
                  >
                    <Ban size={14} />
                    حظر
                  </button>
                </>
              )}

              <div className="border-t border-card-border" />

              {/* Add Credits */}
              <button
                onClick={() => { setModal("credits"); setOpen(false); }}
                className="w-full text-right flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-surface-2 transition-colors"
              >
                <Coins size={14} />
                إضافة أرصدة
              </button>

              {/* Send Notification */}
              <button
                onClick={() => { setModal("notify"); setOpen(false); }}
                className="w-full text-right flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-surface-2 transition-colors"
              >
                <Bell size={14} />
                إرسال إشعار
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {modal === "role" && (
        <ManageRoleModal user={user} onClose={() => setModal(null)} onSuccess={onMutate} />
      )}
      {(modal === "suspend" || modal === "ban") && (
        <ConfirmActionModal user={user} action={modal} onClose={() => setModal(null)} onSuccess={onMutate} />
      )}
      {modal === "credits" && (
        <AddCreditsModal user={user} onClose={() => setModal(null)} onSuccess={onMutate} />
      )}
      {modal === "notify" && (
        <SendNotificationModal user={user} onClose={() => setModal(null)} onSuccess={onMutate} />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { data: usersData, mutate: mutateUsers } = useSWR('/api/admin/users?limit=200', fetcher);
  const users = usersData?.users;
  const { data: currentUserData } = useSWR('/api/users/me', fetcher);
  const currentUser = currentUserData?.user;
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState<"all" | string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "banned">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "none" | "starter" | "growth" | "dominant">("all");
  const [currentPage, setCurrentPage] = useState(0);

  // Reset to first page when any filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [search, countryFilter, statusFilter, planFilter]);

  const countryOptions = useMemo(() => {
    if (!users) return [];
    const values = new Set<string>();
    for (const user of users) {
      if (user.detected_country) values.add(user.detected_country.toUpperCase());
      if (user.pricing_country) values.add(user.pricing_country.toUpperCase());
    }
    return Array.from(values).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    return users.filter((u: any) => {
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.billing?.plan_key ?? "").toLowerCase().includes(q) ||
        (u.detected_country ?? "").toLowerCase().includes(q) ||
        (u.pricing_country ?? "").toLowerCase().includes(q);

      const matchesCountry =
        countryFilter === "all" ||
        (u.detected_country ?? "").toUpperCase() === countryFilter ||
        (u.pricing_country ?? "").toUpperCase() === countryFilter;

      const matchesStatus =
        statusFilter === "all" || (u.status ?? "active") === statusFilter;

      const userPlan = u.billing?.plan_key ?? "none";
      const matchesPlan = planFilter === "all" || userPlan === planFilter;

      return matchesSearch && matchesCountry && matchesStatus && matchesPlan;
    });
  }, [users, search, countryFilter, statusFilter, planFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages - 1);
  const paginatedUsers = filteredUsers.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  if (!users) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black mb-2">المستخدمون</h1>
          <p className="text-muted">{users.length} مستخدم مسجل</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <div className="relative md:col-span-2">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد أو الدولة..."
            className="w-full pr-12 pl-4 py-3 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as typeof planFilter)}
          className="w-full px-3 py-3 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">كل الخطط</option>
          <option value="none">مجاني</option>
          <option value="starter">أساسي</option>
          <option value="growth">احترافي</option>
          <option value="dominant">بريميوم</option>
        </select>
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="w-full px-3 py-3 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">كل الدول</option>
          {countryOptions.map((country: string) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="w-full px-3 py-3 bg-surface-1 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="suspended">موقوف</option>
          <option value="banned">محظور</option>
        </select>
      </div>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <div className="bg-surface-1 border border-card-border rounded-2xl overflow-visible">
          <div className="overflow-x-auto overflow-y-visible rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-surface-2/30">
                  <th className="text-right py-3 px-4 font-medium text-muted">المستخدم</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">الدور</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">حالة الحساب</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">الخطة</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">الاشتراك</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">الدولة</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">الأرصدة</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">التوليدات</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">تكلفة AI</th>
                  <th className="text-right py-3 px-4 font-medium text-muted">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user: any) => (
                  <tr key={user.id} className="border-b border-card-border/50 hover:bg-surface-2/20 transition-colors">
                    <td className="py-3 px-4 relative overflow-visible">
                      <div>
                        <div className="font-medium flex items-center gap-1.5">
                          {user.role === "owner" && <Crown size={14} className="text-accent" />}
                          {user.role === "admin" && <Shield size={14} className="text-primary" />}
                          {user.name}
                        </div>
                        <div className="text-xs text-muted">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        user.role === "owner" ? "bg-accent/20 text-accent" :
                        user.role === "admin" ? "bg-primary/20 text-primary" :
                        "bg-muted/20 text-muted"
                      }`}>
                        {user.role === "owner" ? "مالك" : user.role === "admin" ? "مسؤول" : "عضو"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        ACCOUNT_STATUS_COLORS[(user.status ?? "active")]
                      }`}>
                        {ACCOUNT_STATUS_LABELS[(user.status ?? "active")]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        PLAN_COLORS[user.billing?.plan_key ?? "none"]
                      }`}>
                        {PLAN_LABELS[user.billing?.plan_key ?? "none"]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium ${
                        user.billing?.status === "active" ? "text-success" : "text-muted"
                      }`}>
                        {STATUS_LABELS[user.billing?.status ?? "none"]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {(user.detected_country || user.pricing_country) ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <span className="text-base leading-none">
                            {countryCodeToFlag(user.pricing_country ?? user.detected_country) ?? ""}
                          </span>
                          <span className="font-mono">{(user.pricing_country ?? user.detected_country ?? "").toUpperCase()}</span>
                        </span>
                      ) : (
                        <span className="text-xs font-mono">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.billing ? (
                        <div className="text-xs">
                          <div>
                            شهري: <span className="font-bold">{user.billing.monthly_credits_used}</span> / {user.billing.monthly_credit_limit}
                          </div>
                          <div>
                            إضافي: <span className="font-bold">{user.billing.addon_credits_balance}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold">{user.totalGenerations ?? "—"}</td>
                    <td className="py-3 px-4 font-mono text-xs">{user.totalCostUsd != null ? `$${Number(user.totalCostUsd).toFixed(4)}` : "—"}</td>
                    <td className="py-3 px-4">
                      <ActionsDropdown
                        user={{
                          id: user.id,
                          name: user.name,
                          email: user.email,
                          role: user.role,
                          status: (user.status ?? "active"),
                        }}
                        currentUserId={currentUser?.id}
                        onMutate={() => mutateUsers()}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-card-border">
              <span className="text-xs text-muted">
                عرض {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filteredUsers.length)} من {filteredUsers.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
                <span className="text-sm font-medium min-w-[4rem] text-center">
                  {safePage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
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
          <Users size={48} className="text-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">
            {search || statusFilter !== "all" || planFilter !== "all" ? "لا توجد نتائج" : "لا يوجد مستخدمون"}
          </h3>
          <p className="text-muted">
            {search || statusFilter !== "all" || planFilter !== "all" ? "حاول تغيير معايير البحث." : "سيظهر المستخدمون هنا عند التسجيل."}
          </p>
        </div>
      )}
    </div>
  );
}
