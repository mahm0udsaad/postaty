"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Coins, Zap, Check } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/hooks/use-locale";

type Bundle = {
  key: "addon_5" | "addon_10";
  credits: number;
  price: string;
};

const BUNDLES: Bundle[] = [
  { key: "addon_5", credits: 5, price: "$3" },
  { key: "addon_10", credits: 10, price: "$7" },
];

export default function TopUpPage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [selectedKey, setSelectedKey] = useState<"addon_5" | "addon_10">("addon_5");

  const selected = BUNDLES.find((b) => b.key === selectedKey)!;
  const checkoutUrl = `/checkout?addon=${selectedKey}`;

  return (
    <main className="min-h-screen relative pt-8 pb-16 px-4 md:pt-16 md:pb-24">
      <div className="max-w-lg mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">{t("العودة", "Back")}</span>
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 mb-4">
            <Coins size={32} className="text-amber-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">
            {t("شحن أرصدة", "Top up credits")}
          </h1>
          <p className="text-muted">
            {t(
              "اختر الباقة المناسبة لاحتياجاتك",
              "Choose the bundle that fits your needs"
            )}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {BUNDLES.map((bundle) => {
            const isSelected = selectedKey === bundle.key;
            return (
              <button
                key={bundle.key}
                onClick={() => setSelectedKey(bundle.key)}
                className={`w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 text-start transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-card-border bg-surface-1 hover:border-muted/40"
                }`}
              >
                <div
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted/40"
                  }`}
                >
                  {isSelected && <Check size={12} className="text-primary-foreground" strokeWidth={3} />}
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <Zap
                    size={18}
                    className={isSelected ? "text-primary shrink-0" : "text-muted shrink-0"}
                  />
                  <span className="font-bold text-base">
                    {t(`${bundle.credits} تصميم`, `${bundle.credits} designs`)}
                  </span>
                </div>

                <span className="text-2xl font-black ms-auto" dir="ltr">
                  {bundle.price}
                </span>
              </button>
            );
          })}
        </div>

        <div className="bg-surface-1 border border-card-border rounded-2xl p-6 md:p-8">
          <TopUpCTA checkoutUrl={checkoutUrl} locale={locale} />

          <p className="text-xs text-muted text-center mt-4">
            {t("دفعة واحدة — بدون اشتراك", "One-time payment — no subscription")}
          </p>
        </div>
      </div>
    </main>
  );
}

function TopUpCTA({
  checkoutUrl,
  locale,
}: {
  checkoutUrl: string;
  locale: "ar" | "en";
}) {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  if (isSignedIn) {
    return (
      <button
        onClick={() => router.push(checkoutUrl)}
        className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-primary to-primary-hover text-primary-foreground hover:shadow-lg hover:shadow-primary/25 transition-all"
      >
        {locale === "ar" ? "متابعة الدفع" : "Proceed to checkout"}
      </button>
    );
  }

  return (
    <Link
      href={`/sign-in?redirect_url=${encodeURIComponent(checkoutUrl)}`}
      className="block w-full py-3.5 rounded-xl font-bold text-center bg-gradient-to-r from-primary to-primary-hover text-primary-foreground hover:shadow-lg hover:shadow-primary/25 transition-all"
    >
      {locale === "ar" ? "سجل دخول للشراء" : "Sign in to purchase"}
    </Link>
  );
}
