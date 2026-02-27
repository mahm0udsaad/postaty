"use client";

import { useAuth } from "@/hooks/use-auth";
import useSWR from "swr";
import {
  Loader2,
  Zap,
  Calendar,
  LogOut,
  LifeBuoy,
  Camera,
  Pencil,
  Check,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { useLocale } from "@/hooks/use-locale";
import { toast } from "sonner";
import { useSupabase } from "@/app/components/supabase-provider";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("API error");
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
    isSignedIn ? "/api/billing" : null,
    fetcher
  );

  // Editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManageSubscription = async () => {
    setLoadingAction("portal");
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      if (!res.ok) throw new Error("Failed to create portal session");
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to open portal:", error);
      toast.error(t("فشل في فتح بوابة الاشتراك", "Failed to open subscription portal"));
      setLoadingAction(null);
    }
  };

  const handleSignOut = async () => {
    setLoadingAction("signout");
    await signOut();
    window.location.href = "/";
  };

  const handleStartEditName = () => {
    setEditName(
      user?.user_metadata?.full_name || user?.user_metadata?.name || ""
    );
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditName("");
  };

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error(t("الاسم مطلوب", "Name is required"));
      return;
    }

    setIsSavingName(true);
    try {
      const formData = new FormData();
      formData.append("name", trimmed);

      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update name");
      }

      // Refresh auth state to pick up new metadata
      await supabase.auth.refreshSession();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        // Force re-render by triggering auth state change
        window.dispatchEvent(new Event("focus"));
      }

      setIsEditingName(false);
      toast.success(t("تم تحديث الاسم بنجاح", "Name updated successfully"));
    } catch (error) {
      console.error("Failed to update name:", error);
      toast.error(
        t("فشل في تحديث الاسم", "Failed to update name")
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        t("حجم الصورة يجب أن يكون أقل من 2 ميغابايت", "Image must be under 2MB")
      );
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        t(
          "يجب أن تكون الصورة بصيغة JPEG أو PNG أو WebP",
          "Only JPEG, PNG, and WebP images are allowed"
        )
      );
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to upload avatar");
      }

      // Refresh auth state
      await supabase.auth.refreshSession();

      toast.success(
        t("تم تحديث الصورة بنجاح", "Profile picture updated successfully")
      );
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      setAvatarPreview(null);
      toast.error(
        t("فشل في تحديث الصورة", "Failed to update profile picture")
      );
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!isLoaded || !isSignedIn || !user) {
    return (
      <main className="min-h-screen relative pt-8 pb-32 px-4 md:pt-16 md:pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2
                size={32}
                className="animate-spin text-muted mx-auto mb-4"
              />
              <p className="text-muted">
                {t("جاري التحميل...", "Loading...")}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const fullName =
    user.user_metadata?.full_name || user.user_metadata?.name || "";
  const avatarUrl =
    avatarPreview ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;
  const email = user.email || "";
  const initials =
    fullName
      ?.split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("") ?? "";

  const planKey =
    creditState && "planKey" in creditState ? creditState.planKey : "none";

  return (
    <main className="min-h-screen relative pt-8 pb-32 px-4 md:pt-16 md:pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-surface-1 border border-card-border rounded-2xl p-8 text-center">
          {/* Avatar with edit overlay */}
          <div className="relative w-24 h-24 mx-auto mb-4 group">
            <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-card-border">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName || "Profile"}
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  {initials}
                </div>
              )}

              {/* Upload overlay */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Camera button */}
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 end-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
              title={t("تغيير الصورة", "Change photo")}
            >
              <Camera size={14} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Name with edit */}
          <div className="flex items-center justify-center gap-2 mb-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") handleCancelEditName();
                  }}
                  autoFocus
                  className="bg-surface-2 border border-card-border rounded-xl px-4 py-2 text-lg font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/50 w-56"
                  placeholder={t("أدخل اسمك", "Enter your name")}
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                >
                  {isSavingName ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                </button>
                <button
                  onClick={handleCancelEditName}
                  disabled={isSavingName}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-black">
                  {fullName || t("بدون اسم", "No name")}
                </h1>
                <button
                  onClick={handleStartEditName}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
                  title={t("تعديل الاسم", "Edit name")}
                >
                  <Pencil size={14} />
                </button>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold ${PLAN_COLORS[planKey]} ${PLAN_BG[planKey]}`}
                >
                  {PLAN_NAMES[planKey]?.[locale] ||
                    t("غير معروف", "Unknown")}
                </span>
              </>
            )}
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
              <Loader2
                size={32}
                className="animate-spin text-muted mx-auto mb-4"
              />
              <p className="text-muted">
                {t(
                  "جاري تحميل بيانات الاشتراك...",
                  "Loading subscription data..."
                )}
              </p>
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
                  <h3 className="font-bold">
                    {t("الأرصدة", "Credits")}
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">
                      {t("الشهري المتبقي", "Monthly remaining")}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {creditState.monthlyRemaining}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">
                      {t("إضافات", "Add-ons")}
                    </span>
                    <span className="text-lg font-bold text-accent">
                      {creditState.addonRemaining}
                    </span>
                  </div>
                  <div className="border-t border-card-border pt-3 flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t("المجموع", "Total")}
                    </span>
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
                  <h3 className="font-bold">
                    {t("الاشتراك", "Subscription")}
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted">
                      {t("الحالة", "Status")}
                    </span>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                          creditState.status === "active"
                            ? "bg-success/20 text-success"
                            : "bg-muted/20 text-muted"
                        }`}
                      >
                        {creditState.status === "active"
                          ? t("نشط", "Active")
                          : t("غير نشط", "Inactive")}
                      </span>
                    </div>
                  </div>
                  {creditState.currentPeriodStart &&
                    creditState.currentPeriodEnd && (
                      <div>
                        <span className="text-sm text-muted">
                          {t("الفترة الحالية", "Current period")}
                        </span>
                        <p className="text-sm text-foreground mt-1">
                          {new Date(
                            creditState.currentPeriodStart
                          ).toLocaleDateString(
                            locale === "ar" ? "ar-SA-u-nu-latn" : "en-US"
                          )}
                          {" - "}
                          {new Date(
                            creditState.currentPeriodEnd
                          ).toLocaleDateString(
                            locale === "ar" ? "ar-SA-u-nu-latn" : "en-US"
                          )}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-col sm:flex-row">
              {"status" in creditState &&
                creditState.status === "active" && (
                  <button
                    onClick={handleManageSubscription}
                    disabled={loadingAction === "portal"}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-surface-1 border border-card-border rounded-2xl font-bold text-foreground hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingAction === "portal" ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>
                          {t("جاري التحميل...", "Loading...")}
                        </span>
                      </>
                    ) : (
                      <span>
                        {t("إدارة الاشتراك", "Manage subscription")}
                      </span>
                    )}
                  </button>
                )}

              {creditState.planKey === "none" && (
                <Link
                  href="/pricing"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/25 transition-all"
                >
                  <Zap size={16} />
                  <span>
                    {t(
                      "عرض الخطط والأسعار",
                      "View plans and pricing"
                    )}
                  </span>
                </Link>
              )}
            </div>
          </>
        ) : null}

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
              <Loader2
                size={32}
                className="animate-spin text-muted mx-auto mb-4"
              />
              <p className="text-muted">
                {t("جاري التحميل...", "Loading...")}
              </p>
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
            <h1 className="text-4xl font-black mb-2">
              {t("الملف الشخصي", "Profile")}
            </h1>
            <p className="text-muted">
              {t(
                "إدارة حسابك والاشتراك والأرصدة",
                "Manage your account, subscription, and credits"
              )}
            </p>
          </div>

          <div className="bg-surface-1 border border-card-border rounded-2xl p-8 text-center">
            <p className="text-lg font-bold mb-2">
              {t(
                "يجب تسجيل الدخول لعرض الإعدادات",
                "You need to sign in to view settings"
              )}
            </p>
            <p className="text-muted mb-6">
              {t(
                "سجل دخولك لإدارة حسابك والاشتراك.",
                "Sign in to manage your account and subscription."
              )}
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
