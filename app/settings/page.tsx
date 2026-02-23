"use client";

import { useAuth } from "@/hooks/use-auth";
import useSWR from "swr";
import { Loader2, Zap, Calendar, LogOut, ExternalLink } from "lucide-react";
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
  const { locale, t } = useLocale();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const { data: creditState, isLoading: isCreditLoading } = useSWR(
    isSignedIn ? '/api/billing' : null,
    fetcher
  );

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

  const planKey = creditState && "planKey" in creditState ? creditState.planKey : "none";

  return (
    <main className="min-h-screen relative pt-8 pb-32 px-4 md:pt-16 md:pb-24">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile Header */}
        <div className="bg-surface-1 border border-card-border rounded-2xl p-8 text-center">
          {/* Avatar */}
          <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-card-border">
            {avatarUrl ? (
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

          {/* Name + Plan Badge */}
          <div className="flex items-center justify-center gap-3 mb-1">
            <h1 className="text-2xl font-black">{fullName || t("بدون اسم", "No name")}</h1>
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

        {/* Support */}
        <div className="bg-surface-2/30 border border-card-border rounded-2xl p-6 text-center">
          <p className="text-sm text-muted">
            {t("هل تحتاج إلى مساعدة؟", "Need help?")}{" "}
            <a
              href="mailto:support@postaty.com"
              className="text-primary hover:underline font-bold"
            >
              {t("تواصل معنا", "Contact us")}
            </a>
          </p>
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
