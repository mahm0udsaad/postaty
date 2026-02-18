import { Suspense } from "react";
import CheckoutClient from "./checkout-client";
import { Loader2 } from "lucide-react";

function CheckoutFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-muted" />
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutClient />
    </Suspense>
  );
}
