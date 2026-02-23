"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { PasswordInput } from "./password-input";
import { useSupabase } from "@/app/components/supabase-provider";

type Step = "start" | "verify-email";

export function SignUpForm() {
  const { t } = useLocale();
  const supabase = useSupabase();
  const router = useRouter();
  const [step, setStep] = useState<Step>("start");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const fullName = `${firstName} ${lastName}`.trim();

    if (password !== confirmPassword) {
      setError(t("كلمات المرور غير متطابقة", "Passwords do not match"));
      setIsLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setStep("verify-email");
  }

  async function handleGoogleSignUp() {
    setIsLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-4 mb-8">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Image
            src="/name_logo_svg.svg"
            alt="Postaty Logo"
            width={180}
            height={50}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {t("إنشاء حساب جديد", "Create account")}
        </h1>
        <p className="text-sm text-muted-foreground text-center">
          {t(
            "انضم إلينا وابدأ في تصميم إعلاناتك بذكاء.",
            "Join us and start creating smarter ads."
          )}
        </p>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-center">
          {error}
        </div>
      )}

      {step === "start" && (
        <form onSubmit={handleSignUp} className="space-y-4 w-full">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-foreground rounded-xl border border-card-border transition-all duration-200 font-medium text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google</span>
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-card-border"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("أو باستخدام البريد", "or use email")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                {t("الاسم الأول", "First name")}
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                placeholder={t("أحمد", "Ahmed")}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                {t("الاسم الأخير", "Last name")}
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                placeholder={t("محمد", "Mohamed")}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("البريد الإلكتروني", "Email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("كلمة المرور", "Password")}
            </label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              {t("8 أحرف على الأقل", "Min 8 characters")}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("تأكيد كلمة المرور", "Confirm password")}
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            {t(
              "بإنشاء حساب، أنت توافق على",
              "By creating an account, you agree to our"
            )}{" "}
            <Link
              href="/terms"
              className="text-primary hover:underline"
              target="_blank"
            >
              {t("شروط الاستخدام", "Terms of Service")}
            </Link>{" "}
            {t("و", "and")}{" "}
            <Link
              href="/privacy"
              className="text-primary hover:underline"
              target="_blank"
            >
              {t("سياسة الخصوصية", "Privacy Policy")}
            </Link>
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t("إنشاء حساب", "Create account")
            )}
          </button>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            {t("لديك حساب بالفعل؟", "Already have an account?")}{" "}
            <Link
              href="/sign-in"
              className="text-primary hover:text-primary-hover font-medium hover:underline transition-colors"
            >
              {t("تسجيل الدخول", "Sign in")}
            </Link>
          </div>
        </form>
      )}

      {step === "verify-email" && (
        <div className="w-full flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {t("تأكيد البريد الإلكتروني", "Verify your email")}
          </h2>
          <p className="text-muted-foreground max-w-[260px] leading-relaxed mb-8">
            {t(
              "أرسلنا رابط تأكيد إلى بريدك الإلكتروني. اضغط عليه للمتابعة.",
              "We sent a confirmation link to your email. Click it to continue."
            )}
          </p>

          <button
            type="button"
            onClick={() => setStep("start")}
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t("العودة", "Go back")}
          </button>
        </div>
      )}
    </div>
  );
}
