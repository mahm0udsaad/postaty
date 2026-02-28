"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Palette, Clock, Images, Settings, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { SPRING } from "@/lib/animation";
import { useLocale } from "@/hooks/use-locale";

type NavItemConfig = {
  href: string;
  labelAr: string;
  labelEn: string;
  icon: LucideIcon;
  disabled?: boolean;
};

const NAV_ITEMS: NavItemConfig[] = [
  { href: "/history", labelAr: "سجلي", labelEn: "History", icon: Clock },
  { href: "/brand-kit", labelAr: "هويتي", labelEn: "Brand kit", icon: Palette },
  // Center FAB is handled separately
  { href: "/showcase", labelAr: "المعرض", labelEn: "Showcase", icon: Images },
  { href: "/settings", labelAr: "إعدادات", labelEn: "Settings", icon: Settings },
];

export function BottomDock() {
  const { t } = useLocale();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  if (isAuthPage) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center md:hidden">
      <div className="relative w-full md:w-auto pointer-events-auto group/dock">

        {/* FAB */}
        <div className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom)-1.5rem)] left-1/2 -translate-x-1/2 z-50">
           <Link href="/create">
             <motion.div
              whileTap={{ scale: 0.85, rotate: -8 }}
              whileHover={{ scale: 1.05 }}
              transition={SPRING.snappy}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary via-primary-hover to-accent text-primary-foreground flex items-center justify-center shadow-[0_8px_30px_rgba(139,92,246,0.4)] border-4 border-background/50 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
              <Sparkles size={28} className="absolute opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300" />
              <Plus size={32} strokeWidth={2.5} className="group-hover:opacity-0 group-hover:scale-50 transition-all duration-300" />
            </motion.div>
          </Link>
        </div>

        {/* Main Dock Container */}
        <div className="relative w-full bg-surface-1/98 border-t border-card-border shadow-[0_-10px_24px_-12px_rgba(0,0,0,0.22)] pb-[env(safe-area-inset-bottom)] transition-all duration-300 ease-out">
          <nav className="flex items-center justify-between px-2 h-16">

            {/* Left Side */}
            <div className="flex-1 flex justify-around pr-4">
              {NAV_ITEMS.slice(0, 2).map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} t={t} />
              ))}
            </div>

            {/* Center Spacer for FAB */}
            <div className="w-16 shrink-0" />

            {/* Right Side */}
            <div className="flex-1 flex justify-around pl-4">
               {NAV_ITEMS.slice(2).map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} t={t} />
              ))}
            </div>

          </nav>
        </div>
      </div>
    </div>
  );
}

function NavItem({ item, pathname, t }: { item: NavItemConfig; pathname: string; t: (ar: string, en: string) => string }) {
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;
  const label = t(item.labelAr, item.labelEn);

  if (item.disabled) {
    return (
      <div className="flex flex-col items-center justify-center w-full opacity-30 grayscale pointer-events-none">
         <Icon size={24} strokeWidth={2} />
         <span className="text-[10px] font-medium mt-1">{label}</span>
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={`relative flex flex-col items-center justify-center w-full h-full group ${
        isActive ? "text-primary" : "text-muted"
      }`}
    >
      <div className="relative p-1.5">
        <Icon
          size={24}
          strokeWidth={isActive ? 2.5 : 2}
          className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
        />
        {isActive && (
          <motion.div
            layoutId="nav-glow"
            className="absolute inset-0 bg-primary/20 rounded-full blur-md"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </div>

      <span className={`text-[10px] font-bold mt-0.5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
        {label}
      </span>

      {/* Active Dot */}
      {isActive && (
         <motion.div
            layoutId="nav-dot"
            className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
         />
      )}
    </Link>
  );
}
