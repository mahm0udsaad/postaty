"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sparkles, Palette, Clock, Zap } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "إنشاء بوستر", icon: Sparkles },
  { href: "/brand-kit", label: "هوية العلامة", icon: Palette },
  { href: "/history", label: "السجل", icon: Clock },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 px-4 py-3 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-sm rounded-2xl px-4 h-16 flex items-center justify-between transition-all duration-300 hover:bg-white/90">
          
          {/* Brand / Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 transition-transform duration-300 group-hover:rotate-12">
              <Image
                src="/logo-symbol.png"
                alt="Postaty Symbol"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">
              Postaty
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden group/nav ${
                    isActive
                      ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
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
            <div className="hidden sm:flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-semibold shadow-sm">
              <Zap size={14} className="fill-amber-500 text-amber-500 animate-pulse" />
              <span>50 رصيد</span>
            </div>
            
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent p-0.5 shadow-md shadow-primary/10 cursor-pointer transition-transform active:scale-95 hover:scale-105">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent text-sm">M</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
