"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-muted" />
        </main>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  );
}

function CheckoutReturnContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const getStatus = useAction(api.billing.getCheckoutSessionStatus);

  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    getStatus({ sessionId })
      .then((result) => setStatus(result.status ?? null))
      .catch(() => setStatus("error"))
      .finally(() => setLoading(false));
  }, [sessionId, getStatus]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-muted mx-auto mb-4" />
          <p className="text-muted">جاري التحقق من حالة الدفع...</p>
        </div>
      </main>
    );
  }

  if (status === "complete") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle2 size={64} className="text-success mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-4">تم بنجاح!</h1>
          <p className="text-muted mb-8">
            شكراً لك. تم تفعيل اشتراكك وأرصدتك بنجاح.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/create"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold"
            >
              ابدأ بالتصميم
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center px-6 py-3 bg-surface-2 border border-card-border text-foreground rounded-xl font-bold hover:bg-surface-2/80 transition-colors"
            >
              إعدادات الحساب
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <XCircle size={64} className="text-destructive mx-auto mb-6" />
        <h1 className="text-3xl font-black mb-4">حدث خطأ</h1>
        <p className="text-muted mb-8">
          لم يتم إكمال عملية الدفع. يرجى المحاولة مرة أخرى.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold"
        >
          العودة لصفحة الأسعار
        </Link>
      </div>
    </main>
  );
}
