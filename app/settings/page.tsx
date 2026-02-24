"use client";

import { useAuth } from "@/hooks/use-auth";
import { useSupabase } from "@/app/components/supabase-provider";
import useSWR from "swr";
import {
  Loader2, Zap, Calendar, LogOut, LifeBuoy,
  Pencil, Camera, Lock, Check, X,
} from "lucide-react";
import { PasswordInput } from "@/app/components/auth/password-input";
import { compressImage } from "@/lib/image-compression";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/hooks/use-locale";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

const PLAN_NAMES: Record<string, { ar: string; en: string }> = {
  none: { ar: "غير مشترك", en: "No plan" },
  starter: { ar: "أساسي", en: "Basic" },
  growth: { ar: "احترافي", en: "Pro" },
  dominant: { ar: "بريميوم", en: "Premium" },
};

const PLAN_COLORS: Record<string, string> = {
  none: "text-muted",
  starter: "text-success",
  growth: "text-primary",
  dominant: "text-accent",
};

const PLAN_BG: Record<string, string> = {
  none: "bg-muted/10",
  starter: "bg-success/10",
  growth: "bg-primary/10",
  dominant: "bg-accent/10",
};

function SettingsPageContent() {
  const { user, isSignedIn, isLoaded, signOut } = useAuth();
  const supabase = useSupabase();
  const { locale, t } = useLocale();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { data: creditState, isLoading: isCreditLoading } = useSWR(
    isSignedIn ? '/api/billing' : null,
    fetcher
  );

  // Profile edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setLoadingAction("portal");
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      if (!res.ok) throw new Error('Failed to create portal session');
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to open portal:", error);
      setLoadingAction(null);
    }
  };

  const handleSignOut = async () => {
    setLoadingAction("signout");
    await signOut();
    window.location.href = "/";
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setNameLoading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      await supabase.auth.refreshSession();
      setIsEditingName(false);
      toast.success(t("تم تحديث الاسم", "Name updated"));
    } catch {
      toast.error(t("فشل تحديث الاسم", "Failed to update name"));
    } finally {
      setNameLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const compressed = await compressImage(file, 1, 512);
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarBase64: compressed }),
      });
      if (!res.ok) throw new Error('Failed');
      await supabase.auth.refreshSession();
      toast.success(t("تم تحديث الصورة", "Avatar updated"));
    } catch {
      toast.error(t("فشل تحديث الصورة", "Failed to update avatar"));
    } finally {
      setAvatarLoading(false);
      e.target.value = "";
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t("كلمات المرور غير متطابقة", "Passwords do not match"));
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError(t("يجب أن تكون كلمة المرور 8 أحرف على الأقل", "Password must be at least 8 characters"));
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed');
      }
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      toast.success(t("تم تغيير كلمة المرور بنجاح", "Password changed successfully"));
      setShowPasswordModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("فشل تغيير كلمة المرور", "Failed to change password");
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn || !user) {
    return (
      <main className="min-h-screen relative pt-8 pb-32 px-4 md:pt-16 md:pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-muted mx-auto mb-4" />
              <p className="text-muted">{t("جاري التحميل...", "Loading...")}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const email = user.email || "";
  const initials = fullName
    ?.split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("") ?? "";

  const isEmailAuth =
    user.app_metadata?.provider === "email" ||
    user.identities?.some((i: any) => i.provider === "email");

  const planKey = creditState && "planKey" in creditState ? creditState.planKey : "none";

  return (
    <main className="min-h-screen relative pt-8 pb-32 px-4 md:pt-16 md:pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile Header */}
        <div className="bg-surface-1 border border-card-border rounded-2xl p-8 text-center">
          {/* Avatar with edit overlay */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-card-border">
              {avatarLoading ? (
                <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-muted" />
                </div>
              ) : avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName || "Profile"}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  {initials}
                </div>
              )}
            </div>
            <label className="absolute bottom-0 left-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary-hover transition-colors shadow-lg">
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Name with inline edit */}
          <div className="flex items-center justify-center gap-3 mb-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3 py-1.5 bg-surface-2 border border-card-border rounded-xl text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <button
                  onClick={handleSaveName}
                  disabled={nameLoading}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
                >
                  {nameLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-black">{fullName || t("بدون اسم", "No name")}</h1>
                <button
                  onClick={() => { setEditName(fullName); setIsEditingName(true); }}
                  className="p-1 rounded-lg hover:bg-surface-2 text-muted hover:text-foreground transition-colors"
                >
                  <Pencil size={14} />
                </button>
              </>
            )}
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${PLAN_COLORS[planKey]} ${PLAN_BG[planKey]}`}>
              {PLAN_NAMES[planKey]?.[locale] || t("غير معروف", "Unknown")}
            </span>
          </div>

          {/* Email */}
          <p className="text-muted text-sm">
            {email || t("بدون بريد", "No email")}
          </p>
        </div>

        {/* Credits & Subscription */}
        {isCreditLoading || creditState === undefined ? (
          <div className="bg-surface-1 border border-card-border rounded-2xl p-8 flex items-center justify-center h-48">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-muted mx-auto mb-4" />
              <p className="text-muted">{t("جاري تحميل بيانات الاشتراك...", "Loading subscription data...")}</p>
            </div>
          </div>
        ) : creditState && "planKey" in creditState ? (
          <>
            {/* Credits Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Credits Card */}
              <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-primary" />
                  <h3 className="font-bold">{t("الأرصدة", "Credits")}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">{t("الشهري المتبقي", "Monthly remaining")}</span>
                    <span className="text-lg font-bold text-primary">
                      {creditState.monthlyRemaining}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">{t("إضافات", "Add-ons")}</span>
                    <span className="text-lg font-bold text-accent">
                      {creditState.addonRemaining}
                    </span>
                  </div>
                  <div className="border-t border-card-border pt-3 flex justify-between items-center">
                    <span className="text-sm font-medium">{t("المجموع", "Total")}</span>
                    <span className="text-2xl font-black text-foreground">
                      {creditState.totalRemaining}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-surface-1 border border-card-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={18} className="text-accent" />
                  <h3 className="font-bold">{t("الاشتراك", "Subscription")}</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted">{t("الحالة", "Status")}</span>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                          creditState.status === "active"
                            ? "bg-success/20 text-success"
                            : "bg-muted/20 text-muted"
                        }`}
                      >
                        {creditState.status === "active" ? t("نشط", "Active") : t("غير نشط", "Inactive")}
                      </span>
                    </div>
                  </div>
                  {creditState.currentPeriodStart && creditState.currentPeriodEnd && (
                    <div>
                      <span className="text-sm text-muted">{t("الفترة الحالية", "Current period")}</span>
                      <p className="text-sm text-foreground mt-1">
                        {new Date(creditState.currentPeriodStart).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                        {" - "}
                        {new Date(creditState.currentPeriodEnd).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-col sm:flex-row">
              {"status" in creditState && creditState.status === "active" && (
                <button
                  onClick={handleManageSubscription}
                  disabled={loadingAction === "portal"}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-surface-1 border border-card-border rounded-2xl font-bold text-foreground hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAction === "portal" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t("جاري التحميل...", "Loading...")}</span>
                    </>
                  ) : (
                    <span>{t("إدارة الاشتراك", "Manage subscription")}</span>
                  )}
                </button>
              )}

              {creditState.planKey === "none" && (
                <Link
                  href="/pricing"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/25 transition-all"
                >
                  <Zap size={16} />
                  <span>{t("عرض الخطط والأسعار", "View plans and pricing")}</span>
                </Link>
              )}
            </div>
          </>
        ) : null}

        {/* Change Password - only for email auth users */}
        {isEmailAuth && (
          <button
            onClick={() => {
              setShowPasswordModal(true);
              setPasswordError(null);
              setPasswordForm({ newPassword: "", confirmPassword: "" });
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-surface-1 border border-card-border rounded-2xl font-bold text-foreground hover:bg-surface-2 transition-colors"
          >
            <Lock size={16} />
            <span>{t("تغيير كلمة المرور", "Change password")}</span>
          </button>
        )}

        {/* Support */}
        <div className="bg-surface-2/30 border border-card-border rounded-2xl p-6 text-center">
          <p className="text-sm text-muted mb-3">
            {t("هل تحتاج إلى مساعدة؟", "Need help?")}
          </p>
          <Link
            href="/support"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors"
          >
            <LifeBuoy size={16} />
            {t("تواصل مع الدعم الفني", "Contact support")}
          </Link>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={loadingAction === "signout"}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500/5 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingAction === "signout" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <LogOut size={16} />
          )}
          <span>{t("تسجيل الخروج", "Sign out")}</span>
        </button>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="bg-surface-1 border border-card-border rounded-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{t("تغيير كلمة المرور", "Change password")}</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg hover:bg-surface-2 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {passwordError && (
              <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {passwordError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                {t("كلمة المرور الجديدة", "New password")}
              </label>
              <PasswordInput
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder={t("8 أحرف على الأقل", "At least 8 characters")}
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("تأكيد كلمة المرور", "Confirm password")}
              </label>
              <PasswordInput
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder={t("أعد إدخال كلمة المرور", "Re-enter password")}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-2 transition-colors"
              >
                {t("إلغاء", "Cancel")}
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : t("حفظ", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function SettingsPage() {
  const { t } = useLocale();
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <main className="min-h-screen relative pt-8 pb-32 px-4 md:pt-16 md:pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-muted mx-auto mb-4" />
              <p className="text-muted">{t("جاري التحميل...", "Loading...")}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen relative pt-8 pb-32 px-4 md:pt-16 md:pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-black mb-2">{t("الملف الشخصي", "Profile")}</h1>
            <p className="text-muted">{t("إدارة حسابك والاشتراك والأرصدة", "Manage your account, subscription, and credits")}</p>
          </div>

          <div className="bg-surface-1 border border-card-border rounded-2xl p-8 text-center">
            <p className="text-lg font-bold mb-2">{t("يجب تسجيل الدخول لعرض الإعدادات", "You need to sign in to view settings")}</p>
            <p className="text-muted mb-6">
              {t("سجل دخولك لإدارة حسابك والاشتراك.", "Sign in to manage your account and subscription.")}
            </p>
            <Link
              href="/sign-in?redirect_url=/settings"
              className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold"
            >
              {t("تسجيل الدخول", "Sign in")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <SettingsPageContent />;
}
