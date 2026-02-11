"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Palette, Clock, LayoutTemplate, Settings, Plus } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/history", label: "سجلي", icon: Clock },
  { href: "/brand-kit", label: "هويتي", icon: Palette },
  // Center FAB is handled separately in layout
  { href: "/templates", label: "القوالب", icon: LayoutTemplate },
  { href: "/settings", label: "إعدادات", icon: Settings, disabled: true },
] as const;

export function BottomDock() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center md:hidden">
      <div className="relative w-full md:w-auto pointer-events-auto group/dock">
        
        {/* FAB Container - Responsive Positioning */}
        {/* Mobile: Above the bar */}
        {/* Desktop: Part of the dock flow, but visually distinct */}
        <div className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom)-1.5rem)] left-1/2 -translate-x-1/2 z-50 md:bottom-3 md:translate-y-0">
           <Link href="/create">
             <motion.div
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary via-indigo-500 to-accent text-white flex items-center justify-center shadow-[0_8px_30px_rgba(79,70,229,0.4)] border-4 border-white/10 md:border-white/50 relative group overflow-hidden md:w-20 md:h-20"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
              <Sparkles size={28} className="absolute opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 md:w-8 md:h-8" />
              <Plus size={32} strokeWidth={2.5} className="group-hover:opacity-0 group-hover:scale-50 transition-all duration-300 md:w-10 md:h-10" />
            </motion.div>
          </Link>
        </div>

        {/* Main Dock Container */}
        <div className="
            relative w-full bg-white/90 backdrop-blur-2xl border-t border-white/50 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]
            md:w-[480px] md:rounded-3xl md:border md:border-white/40 md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] md:pb-0 md:bg-white/80 md:h-24 md:px-6
            transition-all duration-300 ease-out
        ">
          <nav className="flex items-center justify-between px-2 h-16 md:h-full">
            
            {/* Left Side */}
            <div className="flex-1 flex justify-around pr-4 md:justify-center md:gap-8 md:pr-12">
              {NAV_ITEMS.slice(0, 2).map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} />
              ))}
            </div>

            {/* Center Spacer for FAB */}
            <div className="w-16 shrink-0 md:w-24" />

            {/* Right Side */}
            <div className="flex-1 flex justify-around pl-4 md:justify-center md:gap-8 md:pl-12">
               {NAV_ITEMS.slice(2).map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} />
              ))}
            </div>

          </nav>
        </div>
      </div>
    </div>
  );
}

function NavItem({ item, pathname }: { item: any; pathname: string }) {
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <div className="flex flex-col items-center justify-center w-full opacity-40 grayscale pointer-events-none md:w-auto">
         <Icon size={24} strokeWidth={2} className="md:w-7 md:h-7" />
         <span className="text-[10px] font-medium mt-1 md:hidden">{item.label}</span>
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={`relative flex flex-col items-center justify-center w-full h-full group md:w-auto md:h-auto md:justify-end md:pb-2 ${
        isActive ? "text-primary" : "text-slate-400"
      }`}
    >
      <div className="relative p-1.5 md:p-3 md:bg-white/0 md:rounded-2xl md:group-hover:bg-white/50 md:transition-colors md:duration-300">
        <Icon
          size={24}
          strokeWidth={isActive ? 2.5 : 2}
          className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'} md:w-7 md:h-7`}
        />
        {isActive && (
          <motion.div
            layoutId="nav-glow"
            className="absolute inset-0 bg-primary/20 rounded-full blur-md md:bg-primary/10 md:rounded-2xl"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </div>
      
      {/* Label - Hidden on Desktop unless hover (Tooltip style) */}
      <span className={`text-[10px] font-bold mt-0.5 transition-colors duration-200 md:hidden ${isActive ? 'text-primary' : 'text-slate-500'}`}>
        {item.label}
      </span>

      {/* Desktop Tooltip */}
      <span className="hidden md:block absolute -top-10 bg-slate-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl">
        {item.label}
        <span className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
      </span>

      {/* Active Dot */}
      {isActive && (
         <motion.div 
            layoutId="nav-dot"
            className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full md:bottom-0 md:w-1.5 md:h-1.5"
         />
      )}
    </Link>
  );
}