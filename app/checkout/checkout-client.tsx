"use client";

import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useLocale } from "@/hooks/use-locale";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const PLAN_LABELS: Record<string, { ar: string; en: string }> = {
  starter: { ar: "أساسي", en: "Basic" },
  growth: { ar: "احترافي", en: "Pro" },
  dominant: { ar: "بريميوم", en: "Premium" },
  addon_5: { ar: "5 أرصدة", en: "5 credits" },
  addon_10: { ar: "10 أرصدة", en: "10 credits" },
};

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useAuth();
  const { locale, t } = useLocale();

  const planKey = searchParams.get("plan") as
    | "starter"
    | "growth"
    | "dominant"
    | null;
  const addonKey = searchParams.get("addon") as
    | "addon_5"
    | "addon_10"
    | null;
  const couponId = searchParams.get("coupon") ?? undefined;

  const fetchClientSecret = useCallback(async () => {
    const theme =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";

    // Read country from cookie (set by middleware, not httpOnly)
    const countryCode =
      document.cookie
        .split("; ")
        .find((c) => c.startsWith("pst_country="))
        ?.split("=")[1] || undefined;

    const res = await fetch('/api/billing/embedded-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planKey: planKey ?? undefined,
        addonKey: addonKey ?? undefined,
        couponId,
        theme,
        countryCode,
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      }),
    });
    if (!res.ok) throw new Error('Failed to create checkout session');
    const { clientSecret } = await res.json();
    return clientSecret;
  }, [planKey, addonKey, couponId]);

  // No plan or addon selected
  if (!planKey && !addonKey) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">{t("لم يتم تحديد خطة", "No plan selected")}</h1>
          <p className="text-muted mb-6">{t("يرجى اختيار خطة من صفحة الأسعار.", "Please choose a plan from the pricing page.")}</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold"
          >
            <ArrowLeft size={16} />
            {t("صفحة الأسعار", "Pricing page")}
          </Link>
        </div>
      </main>
    );
  }

  // Loading auth
  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-muted" />
      </main>
    );
  }

  // Not authenticated
  if (!isSignedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">{t("يرجى تسجيل الدخول", "Please sign in")}</h1>
          <p className="text-muted mb-6">{t("تحتاج لتسجيل الدخول لإتمام عملية الدفع.", "You need to sign in to complete checkout.")}</p>
          <Link
            href={`/sign-in?redirect_url=/checkout?${planKey ? `plan=${planKey}` : `addon=${addonKey}`}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold"
          >
            {t("تسجيل الدخول", "Sign in")}
          </Link>
        </div>
      </main>
    );
  }

  const itemLabel = PLAN_LABELS[planKey ?? addonKey ?? ""]?.[locale] ?? "";

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">{t("العودة للأسعار", "Back to pricing")}</span>
          </Link>
          <h1 className="text-2xl font-black mb-2">
            {planKey ? t("اشتراك", "Subscribe to") : t("شراء", "Purchase")} {itemLabel}
          </h1>
          <p className="text-sm text-muted">
            {t("أكمل عملية الدفع أدناه", "Complete checkout below")}
          </p>
        </div>

        {/* Embedded Checkout */}
        <div id="checkout" className="bg-surface-1 border border-card-border rounded-2xl overflow-hidden">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </main>
  );
}
