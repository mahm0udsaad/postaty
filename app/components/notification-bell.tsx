"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Info, AlertTriangle, CircleCheck, Coins, Cog } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

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

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} ي`;
  return new Date(timestamp).toLocaleDateString("ar-SA");
}

export function NotificationBell() {
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = useQuery(api.notifications.getUnreadCount, userId ? {} : "skip");
  const notifications = useQuery(
    api.notifications.listMyNotifications,
    userId ? { limit: 10 } : "skip"
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!userId) return null;

  const count = unreadCount ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-surface-2/60 transition-colors"
        aria-label="الإشعارات"
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
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
              <h3 className="text-sm font-bold">الإشعارات</h3>
              {count > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
                >
                  <CheckCheck size={14} />
                  قراءة الكل
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[320px]">
              {notifications && notifications.length > 0 ? (
                notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] ?? Info;
                  const color = TYPE_COLORS[n.type] ?? "text-muted";
                  return (
                    <button
                      key={n._id}
                      onClick={() => {
                        if (!n.isRead) markAsRead({ notificationId: n._id as Id<"notifications"> });
                      }}
                      className={`w-full text-right px-4 py-3 flex gap-3 hover:bg-surface-2/40 transition-colors border-b border-card-border/50 last:border-b-0 ${
                        !n.isRead ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className={`shrink-0 mt-0.5 ${color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold truncate">{n.title}</span>
                          {!n.isRead && (
                            <span className="shrink-0 w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted line-clamp-2 mt-0.5">{n.body}</p>
                        <span className="text-[10px] text-muted mt-1 block">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center">
                  <Bell size={24} className="text-muted mx-auto mb-2" />
                  <p className="text-xs text-muted">لا توجد إشعارات</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications && notifications.length > 0 && (
              <div className="border-t border-card-border px-4 py-2">
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="block text-center text-xs text-primary font-bold hover:text-primary-hover transition-colors py-1"
                >
                  عرض جميع الإشعارات
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
