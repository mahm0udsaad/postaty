"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDevIdentity } from "@/hooks/use-dev-identity";
import { BrandKitForm } from "./brand-kit-form";
import { Palette, Loader2 } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function BrandKitPage() {
  const searchParams = useSearchParams();
  const { isLoading: isIdentityLoading, isAuthenticated } = useDevIdentity();
  const existingKit = useQuery(
    api.brandKits.getDefault,
    isAuthenticated ? {} : "skip"
  );
  const nextParam = searchParams.get("next");
  const redirectTo = nextParam?.startsWith("/") ? nextParam : undefined;

  // Show loading while query initializes (undefined = loading, null = no kit)
  const isLoading = isIdentityLoading || (isAuthenticated && existingKit === undefined);

  return (
    <main className="min-h-screen py-12 px-4 relative overflow-hidden bg-grid-pattern">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4 bg-surface-1/80 backdrop-blur-sm px-6 py-2 rounded-full border border-card-border shadow-sm animate-fade-in-up">
            <Palette size={24} className="text-primary" />
            <span className="text-foreground font-semibold tracking-wide text-sm">تخصيص العلامة</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-foreground animate-gradient-flow">
            هوية العلامة التجارية
          </h1>
          <p className="text-muted text-lg max-w-xl mx-auto leading-relaxed font-light">
            أضف شعارك وألوانك لتطبيقها تلقائياً على كل البوسترات التي تنشئها
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-16">
            <p className="text-muted mb-6">سجل الدخول لإدارة هوية علامتك التجارية</p>
            {AUTH_ENABLED ? (
              <SignInButton forceRedirectUrl="/brand-kit">
                <button className="px-6 py-3 bg-primary text-white rounded-xl font-bold">
                  تسجيل الدخول
                </button>
              </SignInButton>
            ) : (
              <Link href="/create" className="px-6 py-3 bg-primary text-white rounded-xl font-bold inline-block">
                ابدأ الآن
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {redirectTo && (
              <div className="text-center">
                <Link
                  href={redirectTo}
                  className="text-sm text-muted hover:text-foreground underline underline-offset-4"
                >
                  تخطي حالياً والمتابعة للتصميم
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
