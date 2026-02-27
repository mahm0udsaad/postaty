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
  ArrowUp,
  User,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronRight,
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

  const creditPercentage = creditState?.monthlyCreditLimit
    ? Math.min(100, Math.round((creditState.monthlyCreditsUsed / creditState.monthlyCreditLimit) * 100))
    : 0;

  return (
    <main className="min-h-screen relative pt-8 pb-32 px-4 md:pt-16 md:pb-24">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted text-sm mb-1">
              <Link href="/" className="hover:text-foreground transition-colors">
                {t("الرئيسية", "Home")}
              </Link>
              <ChevronRight size={14} className="opacity-50" />
              <span>{t("الإعدادات", "Settings")}</span>
            </div>
            <h1 className="text-3xl font-black">{t("إعدادات الحساب", "Account Settings")}</h1>
          </div>
          <div className="hidden sm:block">
            <Settings size={32} className="text-muted/20" />
          </div>
        </div>

        {/* Section: Account Profile */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <User size={18} className="text-primary" />
            <h2 className="font-bold text-lg">{t("الملف الشخصي", "Profile")}</h2>
          </div>
          
          <div className="bg-surface-1 border border-card-border rounded-3xl overflow-hidden transition-all hover:border-primary/20 shadow-sm relative">
            {/* Banner Background */}
            <div className="h-24 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 w-full absolute top-0 left-0 border-b border-card-border/50"></div>
            
            <div className="p-6 sm:p-8 pt-12 sm:pt-16 relative flex flex-col sm:flex-row items-center sm:items-end text-center sm:text-start gap-6">
              {/* Avatar with edit overlay */}
              <div className="relative w-28 h-28 group shrink-0">
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-surface-1 shadow-md bg-surface-1">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={fullName || "Profile"}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="112px"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-3xl font-bold">
                      {initials}
                    </div>
                  )}

                  {/* Upload overlay */}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-white" />
                    </div>
                  )}
                </div>

                {/* Camera button */}
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute z-10 bottom-0 end-0 w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover transition-all scale-100 active:scale-95 disabled:opacity-50 cursor-pointer border-2 border-surface-1"
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

              <div className="flex-1 space-y-3 w-full pb-2">
                {/* Name with edit */}
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3">
                  {isEditingName ? (
                    <div className="flex items-center gap-2 w-full max-w-sm bg-surface-2 p-1.5 rounded-2xl border border-card-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName();
                          if (e.key === "Escape") handleCancelEditName();
                        }}
                        autoFocus
                        className="bg-transparent px-3 py-1.5 text-lg font-bold text-foreground focus:outline-none w-full"
                        placeholder={t("أدخل اسمك", "Enter your name")}
                      />
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={handleSaveName}
                          disabled={isSavingName}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
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
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-3 text-muted hover:text-foreground transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                        {fullName || t("بدون اسم", "No name")}
                      </h3>
                      <button
                        onClick={handleStartEditName}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 text-muted hover:text-foreground hover:bg-surface-3 transition-all shadow-sm border border-card-border/50"
                        title={t("تعديل الاسم", "Edit name")}
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-card-border/50 text-muted text-sm font-medium">
                    <User size={12} className="opacity-50" />
                    <span>{email || t("بدون بريد", "No email")}</span>
                  </div>
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-black ${PLAN_COLORS[planKey]} ${PLAN_BG[planKey]} border border-current/10`}
                  >
                    <Zap size={12} className="opacity-70" />
                    <span>{PLAN_NAMES[planKey]?.[locale] || t("غير معروف", "Unknown")}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Subscription & Credits */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <CreditCard size={18} className="text-accent" />
            <h2 className="font-bold text-lg">{t("الاشتراك والأرصدة", "Subscription & Credits")}</h2>
          </div>

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
          <div className="space-y-6">
            {/* Credits & Usage */}
            <div className="bg-surface-1 border border-card-border rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 sm:p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black">{t("رصيد العمليات", "Credits Balance")}</h3>
                    <p className="text-muted text-sm">{t("الرصيد المتاح لإنشاء التصاميم", "Available credits for creation")}</p>
                  </div>
                  <div className="text-end">
                    <div className="text-3xl font-black text-primary leading-none">
                      {creditState.totalRemaining}
                    </div>
                    <div className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">
                      {t("رصيد كلي", "Total Remaining")}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-muted">{t("الاستخدام الشهري", "Monthly Usage")}</span>
                    <span>{creditState.monthlyCreditsUsed} / {creditState.monthlyCreditLimit}</span>
                  </div>
                  <div className="h-3 bg-surface-2 rounded-full overflow-hidden border border-card-border/50">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-1000 ease-out rounded-full"
                      style={{ width: `${creditPercentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted text-center italic">
                    {creditPercentage > 80 
                      ? t("لقد اقتربت من استهلاك كامل رصيدك الشهري", "You've almost used up your monthly credits")
                      : t("يتم تجديد الرصيد تلقائياً في بداية كل شهر ميلادي", "Credits renew automatically at the start of each month")}
                  </p>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-4 sm:gap-8 pt-4 border-t border-card-border/50">
                  <div className="space-y-1">
                    <span className="text-xs text-muted font-medium">{t("الإضافات", "Add-on Credits")}</span>
                    <p className="text-lg font-bold text-accent">{creditState.addonRemaining}</p>
                  </div>
                  <div className="space-y-1 text-end">
                    <span className="text-xs text-muted font-medium">{t("المتبقي من الشهر", "Monthly Remaining")}</span>
                    <p className="text-lg font-bold text-foreground">{creditState.monthlyRemaining}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-card-border">
                {/* Subscription date info */}
                <div className="px-6 sm:px-8 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-card-border/50 rtl:sm:divide-x-reverse">
                  {/* Status */}
                  <div className="flex items-center gap-3 sm:pe-4 pb-4 sm:pb-0">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-muted font-medium mb-0.5">{t("الحالة", "Status")}</p>
                      <span className={`inline-block text-xs font-black px-2 py-0.5 rounded-full ${
                        creditState.status === "active"
                          ? "bg-success/15 text-success"
                          : creditState.status === "trialing"
                          ? "bg-primary/15 text-primary"
                          : creditState.status === "past_due"
                          ? "bg-warning/15 text-warning"
                          : "bg-muted/15 text-muted"
                      }`}>
                        {creditState.status === "active"
                          ? t("نشط", "Active")
                          : creditState.status === "trialing"
                          ? t("تجريبي", "Trial")
                          : creditState.status === "past_due"
                          ? t("متأخر", "Past due")
                          : t("غير نشط", "Inactive")}
                      </span>
                    </div>
                  </div>

                  {/* Start date */}
                  <div className="flex items-center gap-3 sm:px-4 py-4 sm:py-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-muted font-medium mb-0.5">{t("بداية الفترة", "Period start")}</p>
                      <p className="text-sm font-bold">
                        {creditState.currentPeriodStart
                          ? new Date(creditState.currentPeriodStart).toLocaleDateString(
                              locale === "ar" ? "ar-SA-u-nu-latn" : "en-US",
                              { day: "numeric", month: "short", year: "numeric" }
                            )
                          : t("—", "—")}
                      </p>
                    </div>
                  </div>

                  {/* Renewal date */}
                  <div className="flex items-center gap-3 sm:ps-4 pt-4 sm:pt-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      creditState.currentPeriodEnd &&
                      Math.ceil((creditState.currentPeriodEnd - Date.now()) / 86400000) <= 5
                        ? "bg-warning/10 text-warning"
                        : "bg-success/10 text-success"
                    }`}>
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-muted font-medium mb-0.5">{t("تجديد في", "Renews on")}</p>
                      {creditState.currentPeriodEnd ? (
                        <>
                          <p className="text-sm font-bold">
                            {new Date(creditState.currentPeriodEnd).toLocaleDateString(
                              locale === "ar" ? "ar-SA-u-nu-latn" : "en-US",
                              { day: "numeric", month: "short", year: "numeric" }
                            )}
                          </p>
                          <p className="text-[11px] text-muted">
                            {(() => {
                              const days = Math.ceil((creditState.currentPeriodEnd - Date.now()) / 86400000);
                              if (days <= 0) return t("اليوم", "Today");
                              if (days === 1) return t("غداً", "Tomorrow");
                              return locale === "ar"
                                ? `بعد ${days} يوم`
                                : `in ${days} days`;
                            })()}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-bold">{t("—", "—")}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="px-6 sm:px-8 pb-6 flex gap-2 justify-end">
                  {creditState.status === "active" && (
                    <button
                      onClick={handleManageSubscription}
                      disabled={loadingAction === "portal"}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-2 border border-card-border rounded-xl font-bold text-sm text-foreground hover:bg-surface-3 transition-colors disabled:opacity-50"
                    >
                      {loadingAction === "portal" ? <Loader2 size={14} className="animate-spin" /> : null}
                      {t("إدارة الاشتراك", "Manage")}
                    </button>
                  )}
                  {creditState.planKey !== "dominant" && (
                    <Link
                      href="/pricing"
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all"
                    >
                      <ArrowUp size={14} />
                      {creditState.planKey === "none" ? t("اشترك الآن", "Subscribe") : t("ترقية", "Upgrade")}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Support & help */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/support" className="block group">
                <div className="bg-surface-1 border border-card-border rounded-3xl p-6 flex items-start gap-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
                    <HelpCircle size={24} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{t("الدعم الفني", "Technical Support")}</h4>
                      <p className="text-sm text-muted leading-relaxed">
                        {t("هل لديك استفسار أو واجهت مشكلة؟ نحن هنا للمساعدة.", "Have a question or facing an issue? We're here to help.")}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-black text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                      {t("تواصل معنا", "Contact Support")}
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>

              <button
                onClick={handleSignOut}
                disabled={loadingAction === "signout"}
                className="block group text-start disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="bg-surface-1 border border-card-border rounded-3xl p-6 flex items-start gap-4 transition-all duration-300 hover:border-danger/30 hover:shadow-lg hover:shadow-danger/5 hover:-translate-y-1 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-danger/20 to-danger/5 flex items-center justify-center text-danger shrink-0 transition-transform group-hover:scale-110">
                    {loadingAction === "signout" ? <Loader2 size={24} className="animate-spin" /> : <LogOut size={24} />}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-foreground group-hover:text-danger transition-colors">{t("تسجيل الخروج", "Sign Out")}</h4>
                      <p className="text-sm text-muted leading-relaxed">
                        {t("الخروج من حسابك الحالي على هذا الجهاز.", "Sign out of your current account on this device.")}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-black text-danger opacity-80 group-hover:opacity-100 transition-opacity">
                      {t("تسجيل الخروج", "Sign Out")}
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : null}
        </section>
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
