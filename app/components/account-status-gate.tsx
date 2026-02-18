"use client";

import { useQuery } from "convex/react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { ShieldX, Ban, LogOut } from "lucide-react";

const AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AccountStatusGate({ children }: { children: React.ReactNode }) {
  if (!AUTH_ENABLED) return <>{children}</>;
  return <AccountStatusGateInner>{children}</AccountStatusGateInner>;
}

function AccountStatusGateInner({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    userId ? {} : "skip"
  );

  // Not signed in, loading, or no user record yet → render normally
  if (!userId || currentUser === undefined || currentUser === null) {
    return <>{children}</>;
  }

  const status = currentUser.status ?? "active";
  if (status === "active") return <>{children}</>;

  const isBanned = status === "banned";
  const Icon = isBanned ? Ban : ShieldX;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
          isBanned ? "bg-red-500/10" : "bg-amber-500/10"
        }`}>
          <Icon size={40} className={isBanned ? "text-red-500" : "text-amber-500"} />
        </div>

        <h1 className="text-2xl font-black">
          {isBanned ? "تم حظر حسابك" : "تم إيقاف حسابك مؤقتاً"}
        </h1>

        {currentUser.statusReason && (
          <p className="text-muted bg-surface-1 border border-card-border rounded-xl p-4 text-sm">
            {currentUser.statusReason}
          </p>
        )}

        <p className="text-muted text-sm">
          {isBanned
            ? "تم حظر حسابك بشكل دائم. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم."
            : "تم إيقاف حسابك مؤقتاً. يرجى التواصل مع الدعم لمعرفة المزيد."}
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="mailto:support@postaty.com"
            className="w-full px-4 py-3 rounded-xl bg-surface-1 border border-card-border text-sm font-bold hover:bg-surface-2 transition-colors"
          >
            تواصل مع الدعم
          </a>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-bold hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
