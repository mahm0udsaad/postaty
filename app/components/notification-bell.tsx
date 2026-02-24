"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Info, AlertTriangle, CircleCheck, Coins, Cog } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/use-locale";

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('API error');
  return r.json();
});

const TYPE_ICONS: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CircleCheck,
  credit: Coins,
  system: Cog,
};

const TYPE_COLORS: Record<string, string> = {
  info: "text-blue-500",
  warning: "text-amber-500",
  success: "text-green-500",
  credit: "text-amber-500",
  system: "text-muted",
};

function formatRelativeTime(timestamp: number | string, locale: "ar" | "en") {
  const ts = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return locale === "ar" ? "الآن" : "Now";
  if (minutes < 60) return locale === "ar" ? `منذ ${minutes} د` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === "ar" ? `منذ ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return locale === "ar" ? `منذ ${days} ي` : `${days}d ago`;
  return new Date(ts).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US");
}

export function NotificationBell() {
  const { userId, isSignedIn } = useAuth();
  const { locale, t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unreadData, mutate: mutateUnread } = useSWR(
    isSignedIn ? '/api/notifications' : null,
    fetcher,
    { refreshInterval: 30000 }
  );
  const { data: notifData, mutate: mutateNotifications } = useSWR(
    isSignedIn && open ? '/api/notifications' : null,
    fetcher
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!isSignedIn) return null;

  const count = unreadData?.unreadCount ?? 0;
  const notifications = notifData?.notifications ?? [];

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      mutateNotifications();
      mutateUnread();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      mutateNotifications();
      mutateUnread();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-surface-2/60 transition-colors"
        aria-label={t("الإشعارات", "Notifications")}
      >
        <Bell size={20} className="text-muted" />
        {count > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-80 max-h-[420px] bg-surface-1 border border-card-border rounded-2xl shadow-xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
              <h3 className="text-sm font-bold">{t("الإشعارات", "Notifications")}</h3>
              {count > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
                >
                  <CheckCheck size={14} />
                  {t("قراءة الكل", "Mark all")}
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-[320px]">
              {notifications.length > 0 ? (
                notifications.map((n: any) => {
                  const Icon = TYPE_ICONS[n.type] ?? Info;
                  const color = TYPE_COLORS[n.type] ?? "text-muted";
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) markAsRead(n.id);
                        // Navigate based on metadata
                        const meta = n.metadata ? (typeof n.metadata === "string" ? JSON.parse(n.metadata) : n.metadata) : null;
                        if (meta?.ticketId) {
                          router.push(`/support/${meta.ticketId}`);
                          setOpen(false);
                        }
                      }}
                      className={`w-full text-right px-4 py-3 flex gap-3 hover:bg-surface-2/40 transition-colors border-b border-card-border/50 last:border-b-0 ${
                        !n.is_read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className={`shrink-0 mt-0.5 ${color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold truncate">{n.title}</span>
                          {!n.is_read && (
                            <span className="shrink-0 w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted line-clamp-2 mt-0.5">{n.body}</p>
                        <span className="text-[10px] text-muted mt-1 block">
                          {formatRelativeTime(n.created_at, locale)}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center">
                  <Bell size={24} className="text-muted mx-auto mb-2" />
                  <p className="text-xs text-muted">{t("لا توجد إشعارات", "No notifications")}</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-card-border px-4 py-2">
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="block text-center text-xs text-primary font-bold hover:text-primary-hover transition-colors py-1"
                >
                  {t("عرض جميع الإشعارات", "View all notifications")}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
