"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { PasswordInput } from "./password-input";

export function SignInForm() {
  const { t } = useLocale();

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
        <h1 className="text-2xl font-bold text-foreground">{t("تسجيل الدخول", "Sign in")}</h1>
        <p className="text-sm text-muted-foreground text-center">
          {t("مرحباً بعودتك! أدخل بياناتك للمتابعة.", "Welcome back! Enter your details to continue.")}
        </p>
      </div>

      <SignIn.Root>
        {/* Step 1: Start — email + password */}
        <SignIn.Step name="start" className="space-y-4 w-full">
          <Clerk.GlobalError className="block text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-center" />

          <div className="grid grid-cols-2 gap-3">
            <Clerk.Connection
              name="google"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-foreground rounded-xl border border-card-border transition-all duration-200 font-medium text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google</span>
            </Clerk.Connection>

            <Clerk.Connection
              name="apple"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-foreground rounded-xl border border-card-border transition-all duration-200 font-medium text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.65-1.02 1.83.05 2.94.97 3.53 1.83-3.23 1.89-2.6 6.55 1.08 7.97-.68 2.05-1.72 3.8-3.34 5.45zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.18 2.26-2.84 4.54-3.74 4.25z" />
              </svg>
              <span>Apple</span>
            </Clerk.Connection>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-card-border"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t("أو باستخدام البريد", "or use email")}</span>
            </div>
          </div>

          <Clerk.Field name="identifier" className="flex flex-col gap-1.5">
            <Clerk.Label className="text-sm font-medium text-foreground">{t("البريد الإلكتروني", "Email")}</Clerk.Label>
            <Clerk.Input
              type="email"
              className="px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
              placeholder="name@example.com"
            />
            <Clerk.FieldError className="text-xs text-danger mt-1" />
          </Clerk.Field>

          <Clerk.Field name="password" className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Clerk.Label className="text-sm font-medium text-foreground">{t("كلمة المرور", "Password")}</Clerk.Label>
              <SignIn.Action navigate="forgot-password" asChild>
                <button type="button" className="text-xs text-primary hover:text-primary-hover hover:underline transition-colors">
                  {t("نسيت كلمة المرور؟", "Forgot password?")}
                </button>
              </SignIn.Action>
            </div>
            <PasswordInput />
            <Clerk.FieldError className="text-xs text-danger mt-1" />
          </Clerk.Field>

          <SignIn.Action submit asChild>
            <button className="w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
              <Clerk.Loading>
                {(isLoading) => isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("تسجيل الدخول", "Sign in")}
              </Clerk.Loading>
            </button>
          </SignIn.Action>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            {t("ليس لديك حساب؟", "Don't have an account?")} {" "}
            <Link href="/sign-up" className="text-primary hover:text-primary-hover font-medium hover:underline transition-colors">
              {t("أنشئ حساباً جديداً", "Create one")}
            </Link>
          </div>
        </SignIn.Step>

        {/* Step 2: Verifications — handles email code (Client Trust) and password reset code */}
        <SignIn.Step name="verifications" className="space-y-4 w-full">
          <Clerk.GlobalError className="block text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-center" />

          {/* Email code verification (triggered by Client Trust on new devices) */}
          <SignIn.Strategy name="email_code">
            <div className="flex flex-col items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-foreground">{t("تحقق من بريدك", "Check your email")}</h2>
              <p className="text-sm text-muted-foreground text-center">
                {t("أرسلنا رمز تحقق إلى بريدك الإلكتروني.", "We sent a verification code to your email.")}
              </p>
            </div>

            <Clerk.Field name="code" className="flex flex-col gap-1.5">
              <Clerk.Label className="text-sm font-medium text-foreground">{t("رمز التحقق", "Verification code")}</Clerk.Label>
              <Clerk.Input
                type="otp"
                className="px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-center tracking-widest"
                placeholder="000000"
              />
              <Clerk.FieldError className="text-xs text-danger mt-1" />
            </Clerk.Field>

            <SignIn.Action submit asChild>
              <button className="w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
                <Clerk.Loading>
                  {(isLoading) => isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("تحقق", "Verify")}
                </Clerk.Loading>
              </button>
            </SignIn.Action>

            <div className="flex items-center justify-between pt-2">
              <SignIn.Action resend asChild>
                <button type="button" className="text-xs text-primary hover:text-primary-hover hover:underline transition-colors">
                  {t("إعادة إرسال الرمز", "Resend code")}
                </button>
              </SignIn.Action>
              <SignIn.Action navigate="previous" asChild>
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors">
                  {t("رجوع", "Go back")}
                </button>
              </SignIn.Action>
            </div>
          </SignIn.Strategy>

          {/* Password reset code verification */}
          <SignIn.Strategy name="reset_password_email_code">
            <div className="flex flex-col items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-foreground">{t("تحقق من بريدك", "Check your email")}</h2>
              <p className="text-sm text-muted-foreground text-center">
                {t("أرسلنا رمز إعادة تعيين كلمة المرور إلى بريدك.", "We sent a password reset code to your email.")}
              </p>
            </div>

            <Clerk.Field name="code" className="flex flex-col gap-1.5">
              <Clerk.Label className="text-sm font-medium text-foreground">{t("رمز التحقق", "Reset code")}</Clerk.Label>
              <Clerk.Input
                type="otp"
                className="px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-center tracking-widest"
                placeholder="000000"
              />
              <Clerk.FieldError className="text-xs text-danger mt-1" />
            </Clerk.Field>

            <SignIn.Action submit asChild>
              <button className="w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
                <Clerk.Loading>
                  {(isLoading) => isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("تحقق", "Verify")}
                </Clerk.Loading>
              </button>
            </SignIn.Action>

            <div className="flex items-center justify-between pt-2">
              <SignIn.Action resend asChild>
                <button type="button" className="text-xs text-primary hover:text-primary-hover hover:underline transition-colors">
                  {t("إعادة إرسال الرمز", "Resend code")}
                </button>
              </SignIn.Action>
              <SignIn.Action navigate="previous" asChild>
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors">
                  {t("رجوع", "Go back")}
                </button>
              </SignIn.Action>
            </div>
          </SignIn.Strategy>
        </SignIn.Step>

        {/* Step 3: Forgot password — triggers the reset email */}
        <SignIn.Step name="forgot-password" className="space-y-4 w-full">
          <div className="flex flex-col items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-foreground">{t("نسيت كلمة المرور؟", "Forgot your password?")}</h2>
            <p className="text-sm text-muted-foreground text-center">
              {t("سنرسل لك رمز تحقق لإعادة تعيين كلمة المرور.", "We'll send you a verification code to reset your password.")}
            </p>
          </div>

          <SignIn.SupportedStrategy name="reset_password_email_code">
            <SignIn.Action submit asChild>
              <button className="w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
                <Clerk.Loading>
                  {(isLoading) => isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("إرسال رمز إعادة التعيين", "Send reset code")}
                </Clerk.Loading>
              </button>
            </SignIn.Action>
          </SignIn.SupportedStrategy>

          <SignIn.Action navigate="previous" asChild>
            <button type="button" className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors pt-2">
              {t("العودة لتسجيل الدخول", "Back to sign in")}
            </button>
          </SignIn.Action>
        </SignIn.Step>

        {/* Step 4: Reset password — enter new password */}
        <SignIn.Step name="reset-password" className="space-y-4 w-full">
          <div className="flex flex-col items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-foreground">{t("إعادة تعيين كلمة المرور", "Reset your password")}</h2>
            <p className="text-sm text-muted-foreground text-center">
              {t("أدخل كلمة المرور الجديدة.", "Enter your new password.")}
            </p>
          </div>

          <Clerk.Field name="password" className="flex flex-col gap-1.5">
            <Clerk.Label className="text-sm font-medium text-foreground">{t("كلمة المرور الجديدة", "New password")}</Clerk.Label>
            <PasswordInput />
            <Clerk.FieldError className="text-xs text-danger mt-1" />
          </Clerk.Field>

          <Clerk.Field name="confirmPassword" className="flex flex-col gap-1.5">
            <Clerk.Label className="text-sm font-medium text-foreground">{t("تأكيد كلمة المرور", "Confirm password")}</Clerk.Label>
            <PasswordInput />
            <Clerk.FieldError className="text-xs text-danger mt-1" />
          </Clerk.Field>

          <SignIn.Action submit asChild>
            <button className="w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
              <Clerk.Loading>
                {(isLoading) => isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("إعادة تعيين كلمة المرور", "Reset password")}
              </Clerk.Loading>
            </button>
          </SignIn.Action>
        </SignIn.Step>
      </SignIn.Root>
      <div id="clerk-captcha" />
    </div>
  );
}
