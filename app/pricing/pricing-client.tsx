"use client";

import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { PricingSet } from "@/lib/country-pricing";
import { PricingCard } from "@/app/components/pricing-card";
import { ArrowLeft, Zap, Loader2 } from "lucide-react";
import Link from "next/link";

const AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

type PlanKey = "starter" | "growth" | "dominant";

type PricingClientProps = {
  countryCode: string;
  fallbackPricing: PricingSet;
};

export default function PricingClient({ countryCode, fallbackPricing }: PricingClientProps) {
  const router = useRouter();
  const convexPricing = useQuery(api.stripeAdmin.getCountryPricing, { countryCode });

  // Build pricing from Convex data or static fallback
  const prices = buildPrices(convexPricing, fallbackPricing);

  return (
    <main className="min-h-screen relative pt-8 pb-16 px-4 md:pt-16 md:pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">العودة</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-center">
            اختر خطتك — <span className="text-gradient">الشهر الأول مخفض</span>
          </h1>
          <p className="text-muted text-lg text-center">
            جميع الخطط مع ضمان استرجاع الأموال 30 يوم
            <span className="block text-xs mt-2 opacity-70">
              الأسعار المعروضة حسب موقعك: {countryCode}
            </span>
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {(["starter", "growth", "dominant"] as const).map((planKey) => (
            <PricingCard
              key={planKey}
              planKey={planKey}
              monthlyPrice={prices[planKey].monthly}
              firstMonthPrice={prices[planKey].firstMonth}
              currencySymbol={prices.symbol}
              isPopular={planKey === "growth"}
              ctaButton={
                <PlanCTA planKey={planKey} isPopular={planKey === "growth"} router={router} />
              }
            />
          ))}
        </div>

        {/* Addon Credit Packs */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black mb-6 text-center">أرصدة إضافية</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AddonCard
              title="5 أرصدة"
              price="$3"
              addonKey="addon_5"
              router={router}
            />
            <AddonCard
              title="10 أرصدة"
              price="$7"
              addonKey="addon_10"
              router={router}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function buildPrices(
  convexPricing: Array<{
    planKey: string;
    monthlyAmountCents: number;
    firstMonthAmountCents: number;
    currencySymbol: string;
  }> | undefined,
  fallback: PricingSet
): {
  symbol: string;
  starter: { monthly: number; firstMonth: number };
  growth: { monthly: number; firstMonth: number };
  dominant: { monthly: number; firstMonth: number };
} {
  if (!convexPricing || convexPricing.length === 0) {
    return {
      symbol: fallback.symbol,
      starter: fallback.starter,
      growth: fallback.growth,
      dominant: fallback.dominant,
    };
  }

  const symbol = convexPricing[0]?.currencySymbol ?? fallback.symbol;
  const result = {
    symbol,
    starter: fallback.starter,
    growth: fallback.growth,
    dominant: fallback.dominant,
  };

  for (const row of convexPricing) {
    const key = row.planKey as PlanKey;
    if (key in result) {
      result[key] = {
        monthly: row.monthlyAmountCents / 100,
        firstMonth: row.firstMonthAmountCents / 100,
      };
    }
  }

  return result;
}

function PlanCTA({
  planKey,
  isPopular,
  router,
}: {
  planKey: PlanKey;
  isPopular: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const { isSignedIn } = AUTH_ENABLED ? useAuth() : { isSignedIn: false };

  const checkoutUrl = `/checkout?plan=${planKey}`;

  if (isSignedIn) {
    return (
      <button
        onClick={() => router.push(checkoutUrl)}
        className={`w-full py-3 rounded-xl font-bold transition-all ${
          isPopular
            ? "bg-gradient-to-r from-primary to-primary-hover text-primary-foreground hover:shadow-lg hover:shadow-primary/25"
            : "border border-card-border text-foreground hover:bg-surface-2"
        }`}
      >
        اشترك الآن
      </button>
    );
  }

  if (AUTH_ENABLED) {
    return (
      <SignInButton forceRedirectUrl={checkoutUrl}>
        <button
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            isPopular
              ? "bg-gradient-to-r from-primary to-primary-hover text-primary-foreground hover:shadow-lg hover:shadow-primary/25"
              : "border border-card-border text-foreground hover:bg-surface-2"
          }`}
        >
          سجل دخول للاشتراك
        </button>
      </SignInButton>
    );
  }

  return (
    <Link
      href="/sign-in"
      className={`block w-full py-3 rounded-xl font-bold text-center transition-all ${
        isPopular
          ? "bg-gradient-to-r from-primary to-primary-hover text-primary-foreground hover:shadow-lg hover:shadow-primary/25"
          : "border border-card-border text-foreground hover:bg-surface-2"
      }`}
    >
      سجل دخول للاشتراك
    </Link>
  );
}

function AddonCard({
  title,
  price,
  addonKey,
  router,
}: {
  title: string;
  price: string;
  addonKey: "addon_5" | "addon_10";
  router: ReturnType<typeof useRouter>;
}) {
  const { isSignedIn } = AUTH_ENABLED ? useAuth() : { isSignedIn: false };
  const checkoutUrl = `/checkout?addon=${addonKey}`;

  return (
    <div className="bg-surface-1 border border-card-border rounded-2xl p-6 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-accent" />
          <span className="font-bold">{title}</span>
        </div>
        <span className="text-2xl font-black" dir="ltr">{price}</span>
        <span className="text-sm text-muted mr-1">دفعة واحدة</span>
      </div>
      {isSignedIn ? (
        <button
          onClick={() => router.push(checkoutUrl)}
          className="px-5 py-2.5 bg-accent/10 text-accent border border-accent/20 rounded-xl font-bold text-sm hover:bg-accent/20 transition-colors"
        >
          شراء
        </button>
      ) : AUTH_ENABLED ? (
        <SignInButton forceRedirectUrl={checkoutUrl}>
          <button className="px-5 py-2.5 bg-accent/10 text-accent border border-accent/20 rounded-xl font-bold text-sm hover:bg-accent/20 transition-colors">
            شراء
          </button>
        </SignInButton>
      ) : (
        <Link
          href="/sign-in"
          className="px-5 py-2.5 bg-accent/10 text-accent border border-accent/20 rounded-xl font-bold text-sm hover:bg-accent/20 transition-colors"
        >
          شراء
        </Link>
      )}
    </div>
  );
}
