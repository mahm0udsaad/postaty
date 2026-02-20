"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeroVisual } from "@/app/components/hero-visual";
import { SignInForm } from "@/app/components/auth/sign-in-form";
import { useLocale } from "@/hooks/use-locale";

export default function SignInPage() {
  const { t } = useLocale();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // While checking auth or redirecting, show nothing
  if (!isLoaded || isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex w-full">
      <div className="hidden lg:flex flex-1 relative bg-surface-2 items-center justify-center overflow-hidden border-l border-card-border">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-md text-center px-8">
          <div className="w-64 shrink-0">
            <HeroVisual />
          </div>
          <div className="mt-6">
            <h2 className="text-3xl font-black mb-3">
              {t("أهلاً بك في", "Welcome to")} <span className="text-gradient">Postaty</span>
            </h2>
            <p className="text-muted text-base leading-relaxed">
              {t("منصتك الذكية لتصميم إعلانات احترافية في ثوانٍ. سجل دخولك وابدأ الإبداع.", "Your smart platform for creating professional ads in seconds. Sign in and start creating.")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-background">
        <SignInForm />
      </div>
    </div>
  );
}
