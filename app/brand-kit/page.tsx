"use client";

import { Suspense } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/use-auth";
import { BrandKitForm } from "./brand-kit-form";
import { Palette, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/hooks/use-locale";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

export default function BrandKitPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 min-h-screen"><Loader2 size={32} className="animate-spin text-primary" /></div>}>
      <BrandKitContent />
    </Suspense>
  );
}

function BrandKitContent() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { isSignedIn, isLoaded } = useAuth();
  const { data: brandKitsData, isLoading: isBrandKitLoading } = useSWR(
    isSignedIn ? '/api/brand-kits' : null,
    fetcher
  );
  const brandKits = brandKitsData?.brandKits as any[] | undefined;
  const existingKit = brandKits?.[0];
  const nextParam = searchParams.get("next");
  const redirectTo = nextParam?.startsWith("/") ? nextParam : undefined;

  // Show loading while query initializes
  const isLoading = !isLoaded || (isSignedIn && isBrandKitLoading);

  return (
    <main className="min-h-screen py-12 px-4 relative overflow-hidden bg-grid-pattern">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4 bg-surface-1/80 backdrop-blur-sm px-6 py-2 rounded-full border border-card-border shadow-sm animate-fade-in-up">
            <Palette size={24} className="text-primary" />
            <span className="text-foreground font-semibold tracking-wide text-sm">{t("تخصيص العلامة", "Brand customization")}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-foreground animate-gradient-flow">
            {t("هوية العلامة التجارية", "Brand identity")}
          </h1>
          <p className="text-muted text-lg max-w-xl mx-auto leading-relaxed font-light">
            {t(
              "أضف شعارك وألوانك لتطبيقها تلقائياً على كل البوسترات التي تنشئها",
              "Add your logo and colors to apply them automatically to every poster you generate"
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : !isSignedIn ? (
          <div className="text-center py-16">
            <p className="text-muted mb-6">{t("سجل الدخول لإدارة هوية علامتك التجارية", "Sign in to manage your brand identity")}</p>
            <Link href="/sign-in?redirect_url=/brand-kit" className="px-6 py-3 bg-primary text-white rounded-xl font-bold inline-block">
              {t("تسجيل الدخول", "Sign in")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {redirectTo && (
              <div className="text-center">
                <Link
                  href={redirectTo}
                  className="text-sm text-muted hover:text-foreground underline underline-offset-4"
                >
                  {t("تخطي حالياً والمتابعة للتصميم", "Skip for now and continue to design")}
                </Link>
              </div>
            )}
            <div className="glass-card p-6 md:p-8">
              <BrandKitForm
                redirectTo={redirectTo}
                existingKit={existingKit ?? undefined}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
