"use client";

import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useAction } from "convex/react";
import { useConvexAuth } from "convex/react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { api } from "@/convex/_generated/api";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const PLAN_LABELS: Record<string, string> = {
  starter: "مبتدي",
  growth: "نمو",
  dominant: "هيمنة",
  addon_5: "5 أرصدة",
  addon_10: "10 أرصدة",
};

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useConvexAuth();

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

  const createEmbeddedCheckout = useAction(api.billing.createEmbeddedCheckout);

  const fetchClientSecret = useCallback(async () => {
    const { clientSecret } = await createEmbeddedCheckout({
      planKey: planKey ?? undefined,
      addonKey: addonKey ?? undefined,
      couponId,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
    return clientSecret;
  }, [createEmbeddedCheckout, planKey, addonKey, couponId]);

  // No plan or addon selected
  if (!planKey && !addonKey) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">لم يتم تحديد خطة</h1>
          <p className="text-muted mb-6">يرجى اختيار خطة من صفحة الأسعار.</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold"
          >
            <ArrowLeft size={16} />
            صفحة الأسعار
          </Link>
        </div>
      </main>
    );
  }

  // Loading auth
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-muted" />
      </main>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">يرجى تسجيل الدخول</h1>
          <p className="text-muted mb-6">تحتاج لتسجيل الدخول لإتمام عملية الدفع.</p>
          <Link
            href={`/sign-in?redirect_url=/checkout?${planKey ? `plan=${planKey}` : `addon=${addonKey}`}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  const itemLabel = PLAN_LABELS[planKey ?? addonKey ?? ""] ?? "";

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
            <span className="text-sm font-medium">العودة للأسعار</span>
          </Link>
          <h1 className="text-2xl font-black mb-2">
            {planKey ? "اشتراك" : "شراء"} {itemLabel}
          </h1>
          <p className="text-sm text-muted">
            أكمل عملية الدفع أدناه
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
