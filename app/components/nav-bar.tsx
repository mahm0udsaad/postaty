"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Palette, Clock, Plus, Loader2, Settings, Coins } from "lucide-react";
import { SignInButton, useAuth, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ThemeToggle } from "./theme-toggle";

const AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const NAV_ITEMS = [
  { href: "/brand-kit", label: "هوية العلامة", icon: Palette },
  { href: "/history", label: "السجل", icon: Clock },
  { href: "/settings", label: "الإعدادات", icon: Settings },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  if (isAuthPage) return null;

  if (!AUTH_ENABLED) {
    return <NavBarNoAuth />;
  }
  return <NavBarWithAuth />;
}

function NavBarWithAuth() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded: isClerkLoaded, userId } = useAuth();

  const isClerkSignedIn = Boolean(userId);

  const handleGenerateClick = () => {
    if (!isClerkLoaded) return;

    if (!isClerkSignedIn) {
      router.push("/sign-in");
    } else {
      router.push("/create");
    }
  };

  return (
    <nav className="sticky top-0 z-50 px-4 py-3 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="bg-surface-1/80 backdrop-blur-xl border border-card-border shadow-sm rounded-2xl px-4 h-16 flex items-center justify-between transition-all duration-300 hover:bg-surface-1/90">

          {/* Brand / Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className=" relative size-24 transition-transform duration-300 group-hover:rotate-12">
              <Image
                src="/name_logo_svg.svg"
                alt="Postaty Symbol"
                fill
                className="object-contain "
                priority
              />
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-1 bg-surface-2/50 p-1 rounded-xl border border-card-border">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden group/nav ${
                    isActive
                      ? "bg-surface-1 text-primary shadow-sm ring-1 ring-card-border"
                      : "text-muted hover:text-foreground hover:bg-surface-1/50"
                  }`}
                >
                  <Icon size={16} className={`transition-transform duration-300 ${isActive ? 'scale-110 text-primary' : 'group-hover/nav:scale-110'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Actions / Credits */}
          <div className="flex items-center gap-3">

            {/* Theme Toggle */}
            <ThemeToggle className="flex" />

            {/* Desktop Generate Button */}
            <button
              onClick={handleGenerateClick}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-primary-foreground text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
            >
              <Plus size={18} />
              <span>إنشاء جديد</span>
            </button>

            {!isClerkLoaded ? (
              <Loader2 size={20} className="animate-spin text-muted" />
            ) : isClerkSignedIn ? (
              <CreditsBadge />
            ) : (
              <div className="hidden sm:block">
                  <SignInButton>
                    <button className="text-sm font-bold text-muted hover:text-primary transition-colors px-3 py-1.5">
                        تسجيل دخول
                    </button>
                  </SignInButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function CreditsBadge() {
  const creditState = useQuery(api.billing.getCreditState);
  const requiresSubscription =
    !!creditState &&
    "planKey" in creditState &&
    creditState.planKey === "none";
  const href = requiresSubscription ? "/pricing" : "/checkout?addon=addon_5";

  return (
    <div className="flex items-center gap-2">
      <Link
        href={href}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2/60 border border-card-border text-sm font-bold transition-all hover:bg-surface-2 hover:border-primary/30 group"
      >
        <Coins size={14} className="text-amber-500" />
        <span className="text-foreground tabular-nums">
          {creditState?.totalRemaining ?? "—"}
        </span>
        {requiresSubscription ? (
          <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity mr-1">
            اشترك
          </span>
        ) : (
          <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity mr-1">
            شحن+
          </span>
        )}
      </Link>
      <UserButton />
    </div>
  );
}

function NavBarNoAuth() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 px-4 py-3 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="bg-surface-1/80 backdrop-blur-xl border border-card-border shadow-sm rounded-2xl px-4 h-16 flex items-center justify-between transition-all duration-300 hover:bg-surface-1/90">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 transition-transform duration-300 group-hover:rotate-12">
              <Image
                src="/icon_logo_svg.svg"
                alt="Postaty Symbol"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-black tracking-tighter text-foreground">
              Postaty
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 bg-surface-2/50 p-1 rounded-xl border border-card-border">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-surface-1 text-primary shadow-sm ring-1 ring-card-border"
                      : "text-muted hover:text-foreground hover:bg-surface-1/50"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="hidden sm:flex" />
            <Link
              href="/create"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-primary-foreground text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
            >
              <Plus size={18} />
              <span>إنشاء جديد</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
