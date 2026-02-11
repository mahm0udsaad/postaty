"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useConvexAuth, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, Loader2, Zap, Calendar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const PLAN_NAMES: Record<string, string> = {
  none: "مجاني",
  starter: "مبتدي",
  growth: "نمو",
  dominant: "هيمنة",
};

const PLAN_COLORS: Record<string, string> = {
  none: "text-muted",
  starter: "text-success",
  growth: "text-primary",
  dominant: "text-accent",
};

function SettingsPageWithClerk() {
  const { isLoaded: isClerkLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const { isAuthenticated: isConvexAuthenticated, isLoading: isConvexLoading } =
    useConvexAuth();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const creditState = useQuery(
    api.billing.getCreditState,
    isConvexAuthenticated ? {} : "skip"
  );

  const createPortalSession = useAction(api.billing.createPortalSession);
  const createSubscriptionCheckout = useAction(
    api.billing.createSubscriptionCheckout
  );

  const handleManageSubscription = async () => {
    setLoadingAction("portal");
    try {
      const { url } = await createPortalSession({
        returnUrl: window.location.href,
      });
      window.location.href = url;
    } catch (error) {
      console.error("Failed to open portal:", error);
      setLoadingAction(null);
    }
  };

  const handleUpgradePlan = async () => {
    setLoadingAction("checkout");
    try {
      const { url } = await createSubscriptionCheckout({
        planKey: "growth",
        successUrl: window.location.href,
        cancelUrl: window.location.href,
      });
      window.location.href = url;
    } catch (error) {
      console.error("Failed to create checkout:", error);
      setLoadingAction(null);
    }
  };

  if (!isClerkLoaded || !clerkUser || !isConvexAuthenticated) {
    return (
      <main className="min-h-screen relative pt-8 pb-16 px-4 md:pt-16 md:pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-muted mx-auto mb-4" />
              <p className="text-muted">جاري التحميل...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative pt-8 pb-16 px-4 md:pt-16 md:pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">العودة</span>
          </Link>
          <h1 className="text-4xl font-black mb-2">الإعدادات</h1>
          <p className="text-muted">إدارة حسابك والاشتراك والأرصدة</p>
        </div>

        {/* Profile Section */}
        <div className="bg-surface-1 border border-card-border rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">معلومات الحساب</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted">الاسم</label>
              <p className="text-lg text-foreground mt-1">{clerkUser.fullName || "بدون اسم"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted">البريد الإلكتروني</label>
              <p className="text-lg text-foreground mt-1">
                {clerkUser.emailAddresses[0]?.emailAddress || "بدون بريد"}
              </p>
            </div>
          </div>
        </div>

        {/* Billing Plan Section */}
        {isConvexLoading || creditState === undefined ? (
          <div className="bg-surface-1 border border-card-border rounded-2xl p-8 mb-6 flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-muted mx-auto mb-4" />
              <p className="text-muted">جاري تحميل بيانات الفاتورة...</p>
            </div>
          </div>
        ) : creditState && "planKey" in creditState ? (
          <div className="bg-surface-1 border border-card-border rounded-2xl p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">خطة الاشتراك</h2>
                <p className="text-muted">حالة الاشتراك والأرصدة</p>
              </div>
              <div
                className={`text-3xl font-black ${PLAN_COLORS[creditState.planKey] || "text-muted"
                  }`}
              >
                {PLAN_NAMES[creditState.planKey] || "غير معروف"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Credits Card */}
              <div className="bg-surface-2/50 border border-card-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-primary" />
                  <h3 className="font-bold">الأرصدة</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">الشهري المتبقي</span>
                    <span className="text-lg font-bold text-primary">
                      {creditState.monthlyRemaining}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">إضافات</span>
                    <span className="text-lg font-bold text-accent">
                      {creditState.addonRemaining}
                    </span>
                  </div>
                  <div className="border-t border-card-border pt-3 flex justify-between items-center">
                    <span className="text-sm font-medium">المجموع المتبقي</span>
                    <span className="text-2xl font-black text-foreground">
                      {creditState.totalRemaining}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-surface-2/50 border border-card-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={18} className="text-accent" />
                  <h3 className="font-bold">التفاصيل</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted">الحالة</span>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${creditState.status === "active"
                          ? "bg-success/20 text-success"
                          : "bg-muted/20 text-muted"
                          }`}
                      >
                        {creditState.status === "active" ? "نشط" : "غير نشط"}
                      </span>
                    </div>
                  </div>
                  {creditState.currentPeriodStart && creditState.currentPeriodEnd && (
                    <div>
                      <span className="text-sm text-muted">الفترة الحالية</span>
                      <p className="text-sm text-foreground mt-1">
                        {new Date(creditState.currentPeriodStart).toLocaleDateString(
                          "ar-SA"
                        )}{" "}
                        -{" "}
                        {new Date(creditState.currentPeriodEnd).toLocaleDateString(
                          "ar-SA"
                        )}
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
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-2 border border-card-border rounded-xl font-bold text-foreground hover:bg-surface-2/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAction === "portal" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>جاري التحميل...</span>
                    </>
                  ) : (
                    <>
                      <span>إدارة الاشتراك</span>
                    </>
                  )}
                </button>
              )}

              {creditState.planKey === "none" && (
                <button
                  onClick={handleUpgradePlan}
                  disabled={loadingAction === "checkout"}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAction === "checkout" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>جاري التحميل...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>ترقية الخطة</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Footer Note */}
        <div className="bg-surface-2/30 border border-card-border rounded-xl p-6 text-center">
          <p className="text-sm text-muted">
            هل تحتاج إلى مساعدة؟{" "}
            <a
              href="mailto:support@postaty.com"
              className="text-primary hover:underline font-bold"
            >
              تواصل معنا
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  if (!AUTH_ENABLED) {
    return (
      <main className="min-h-screen relative pt-8 pb-16 px-4 md:pt-16 md:pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">العودة</span>
            </Link>
            <h1 className="text-4xl font-black mb-2">الإعدادات</h1>
            <p className="text-muted">إدارة حسابك والاشتراك والأرصدة</p>
          </div>

          <div className="bg-surface-1 border border-card-border rounded-2xl p-8 text-center">
            <p className="text-lg font-bold mb-2">صفحة الإعدادات تتطلب تفعيل تسجيل الدخول</p>
            <p className="text-muted mb-6">
              أضف `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` لتفعيل الحسابات والاشتراكات.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold"
            >
              الرجوع للرئيسية
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <SettingsPageWithClerk />;
}
