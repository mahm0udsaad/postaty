"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { SignInForm } from "@/app/components/auth/sign-in-form";
import { AuthVisual } from "@/app/components/auth/auth-visual";
import { useLocale } from "@/hooks/use-locale";
import Image from "next/image";

export default function SignInPage() {
  const { t } = useLocale();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex w-full bg-background overflow-hidden">
      {/* Visual Column */}
      <div className="hidden lg:block flex-1 relative bg-surface-2 overflow-hidden border-l border-card-border h-screen sticky top-0">
         <AuthVisual />
         
         <div className="absolute bottom-8 left-8 right-8 z-20">
            <h1 className="text-3xl font-bold leading-tight mb-2 drop-shadow-lg">
             {t("حول أفكارك إلى", "Turn your ideas into")} <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{t("تصاميم مذهلة", "Stunning Designs")}</span>
           </h1>
           <p className="text-sm text-foreground/80 max-w-md leading-relaxed drop-shadow-md backdrop-blur-sm bg-background/30 p-2 rounded-lg inline-block border border-white/10">
             {t(
               "انضم إلى الآلاف من صناع المحتوى والمسوقين.",
               "Join thousands of creators and marketers."
             )}
           </p>
         </div>
      </div>

      {/* Form Column */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-y-auto">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.15] pointer-events-none" />
        <div className="relative w-full max-w-sm z-10">
           <SignInForm />
        </div>
      </div>
    </div>
  );
}
