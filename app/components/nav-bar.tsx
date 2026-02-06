"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Palette, Clock, LayoutTemplate } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "إنشاء بوستر", icon: Sparkles },
  { href: "/brand-kit", label: "هوية العلامة", icon: Palette },
  { href: "/templates", label: "القوالب", icon: LayoutTemplate },
  { href: "/history", label: "السجل", icon: Clock },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-card-border/50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-1 h-14">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-foreground hover:bg-slate-50"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
