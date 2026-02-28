"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { Palette, Clock, Plus, Loader2, Settings, Coins, Languages } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import useSWR from "swr";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";
import type { AppLocale } from "@/lib/i18n";
import { LOCALE_COOKIE } from "@/lib/i18n";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

const COPY = {
  ar: {
    navItems: [
      { href: "/brand-kit", label: "هوية العلامة", icon: Palette },
      { href: "/history", label: "السجل", icon: Clock },
      { href: "/settings", label: "الإعدادات", icon: Settings },
    ],
    newPost: "إنشاء جديد",
    signIn: "تسجيل دخول",
    subscribe: "اشترك",
    topUp: "شحن+",
    profileAlt: "الملف الشخصي",
    langToggle: "English",
  },
  en: {
    navItems: [
      { href: "/brand-kit", label: "Brand Kit", icon: Palette },
      { href: "/history", label: "History", icon: Clock },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
    newPost: "Create New",
    signIn: "Sign In",
    subscribe: "Upgrade",
    topUp: "Top up+",
    profileAlt: "Profile image",
    langToggle: "العربية",
  },
} as const;

type NavBarProps = {
  locale: AppLocale;
};

type AuthUserLike = {
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
};

export function NavBar({ locale }: NavBarProps) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  if (isAuthPage) return null;

  return <NavBarContent locale={locale} />;
}

function NavBarContent({ locale }: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useAuth();
  const copy = COPY[locale];
  const nextLocale = locale === "ar" ? "en" : "ar";

  const handleGenerateClick = () => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/sign-in");
    } else {
      router.push("/create");
    }
  };

  const handleLogoClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;
    e.preventDefault();
    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLocaleSwitch = () => {
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 px-4 py-3 [transform:translateZ(0)]">
      <div className="max-w-7xl mx-auto">
        <div className="mobile-no-blur bg-surface-1/90 md:bg-surface-1/80 md:backdrop-blur-xl border border-card-border shadow-sm rounded-2xl px-4 h-16 flex items-center justify-between transition-all duration-300 hover:bg-surface-1/90">
          <Link href="/" onClick={handleLogoClick} className="flex items-center gap-2 group">
            <div className="relative size-24 md:transition-transform md:duration-300 md:group-hover:rotate-12">
              <Image
                src="/name_logo_svg.svg"
                alt="Postaty Symbol"
                fill
                className="object-contain "
                priority
              />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1 bg-surface-2/50 p-1 rounded-xl border border-card-border">
            {copy.navItems.map((item) => {
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
                  <Icon size={16} className={`transition-transform duration-300 ${isActive ? "scale-110 text-primary" : "group-hover/nav:scale-110"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="flex" />
            <button
              type="button"
              onClick={handleLocaleSwitch}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-card-border text-sm font-bold text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <Languages size={14} />
              <span>{copy.langToggle}</span>
            </button>

            <button
              onClick={handleGenerateClick}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-primary-foreground text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
            >
              <Plus size={18} />
              <span>{copy.newPost}</span>
            </button>

            {!isLoaded ? (
              <Loader2 size={20} className="animate-spin text-muted" />
            ) : isSignedIn ? (
              <>
                <NotificationBell />
                <CreditsBadge locale={locale} user={user} />
              </>
            ) : (
              <div className="hidden sm:block">
                <Link href="/sign-in" className="text-sm font-bold text-muted hover:text-primary transition-colors px-3 py-1.5">
                  {copy.signIn}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function CreditsBadge({ locale, user }: NavBarProps & { user: AuthUserLike | null | undefined }) {
  const { data: creditState } = useSWR('/api/billing', fetcher);
  const requiresSubscription =
    !!creditState &&
    "planKey" in creditState &&
    creditState.planKey === "none";
  const href = requiresSubscription ? "/pricing" : "/top-up";
  const copy = COPY[locale];

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const initials = fullName
    ?.split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("") ?? "";

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
            {copy.subscribe}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity mr-1">
            {copy.topUp}
          </span>
        )}
      </Link>
      <Link
        href="/settings"
        className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-card-border hover:border-primary/50 transition-colors shrink-0"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={copy.profileAlt}
            fill
            className="object-cover"
            sizes="36px"
          />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
            {initials}
          </div>
        )}
      </Link>
    </div>
  );
}
