"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import useSWR from "swr";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ImageIcon,
  Loader2,
  ShieldAlert,
  ChevronLeft,
  Menu,
  X,
  Globe,
} from "lucide-react";
import { useState } from "react";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(r.status === 403 ? "forbidden" : "API error");
    return r.json();
  });

const REGIONAL_NAV = [
  {
    href: "/regional",
    label: "نظرة عامة",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/regional/users", label: "المستخدمون", icon: Users },
  { href: "/regional/subscriptions", label: "الاشتراكات", icon: CreditCard },
  { href: "/regional/generations", label: "التوليدات", icon: ImageIcon },
] as const;

export default function RegionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Use overview endpoint to check access
  const { error: accessError, isLoading: isAccessLoading } = useSWR(
    isSignedIn ? "/api/regional/overview?periodDays=1" : null,
    fetcher
  );

  // Loading state
  if (!isLoaded || (isSignedIn && isAccessLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="animate-spin text-muted mx-auto mb-4"
          />
          <p className="text-muted">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-surface-1 border border-card-border rounded-2xl p-8 max-w-md w-full text-center">
          <ShieldAlert size={48} className="text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">غير مصرح</h1>
          <p className="text-muted mb-6">
            يرجى تسجيل الدخول للوصول إلى لوحة التحليلات.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold"
          >
            <ChevronLeft size={16} />
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  // No access
  if (accessError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-surface-1 border border-card-border rounded-2xl p-8 max-w-md w-full text-center">
          <ShieldAlert size={48} className="text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">صلاحيات غير كافية</h1>
          <p className="text-muted mb-6">
            ليس لديك صلاحية الوصول إلى لوحة التحليلات الإقليمية. تواصل مع
            المسؤول للحصول على الصلاحية.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-xl font-bold"
          >
            <ChevronLeft size={16} />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-24 right-4 z-40 md:hidden p-2 bg-surface-1 border border-card-border rounded-xl shadow-lg"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 right-0 z-30 h-screen w-64 bg-surface-1 border-l border-card-border flex flex-col transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-card-border">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={20} className="text-primary" />
            <h2 className="text-lg font-black text-foreground">
              التحليلات الإقليمية
            </h2>
          </div>
          <p className="text-xs text-muted mt-1">
            الأردن - فلسطين - إسرائيل
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {REGIONAL_NAV.map((item) => {
            const Icon = item.icon;
            const isActive =
              "exact" in item && item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted hover:text-foreground hover:bg-surface-2/50"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-card-border">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
            <span>العودة للموقع</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
