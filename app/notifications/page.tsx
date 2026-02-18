"use client";

import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Bell, CheckCheck, Info, AlertTriangle, CircleCheck, Coins, Cog, Check, Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

const TYPE_ICONS: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CircleCheck,
  credit: Coins,
  system: Cog,
};

const TYPE_COLORS: Record<string, string> = {
  info: "text-blue-500 bg-blue-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  success: "text-green-500 bg-green-500/10",
  credit: "text-amber-500 bg-amber-500/10",
  system: "text-muted bg-muted/10",
};

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const { userId } = useAuth();
  const notifications = useQuery(
    api.notifications.listMyNotifications,
    userId ? { limit: 100 } : "skip"
  );
  const unreadCount = useQuery(api.notifications.getUnreadCount, userId ? {} : "skip");
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  if (notifications === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">الإشعارات</h1>
          <p className="text-muted text-sm">
            {(unreadCount ?? 0) > 0
              ? `${unreadCount} إشعار غير مقروء`
              : "لا توجد إشعارات جديدة"}
          </p>
        </div>
        {(unreadCount ?? 0) > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-1 border border-card-border text-sm font-bold hover:bg-surface-2 transition-colors"
          >
            <CheckCheck size={16} />
            قراءة الكل
          </button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Info;
            const colorClasses = TYPE_COLORS[n.type] ?? "text-muted bg-muted/10";
            const [textColor, bgColor] = colorClasses.split(" ");
            return (
              <div
                key={n._id}
                className={`bg-surface-1 border rounded-2xl p-4 flex gap-4 transition-colors ${
                  !n.isRead
                    ? "border-primary/30 bg-primary/5"
                    : "border-card-border"
                }`}
              >
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
                  <Icon size={20} className={textColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        {n.title}
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </h3>
                      <p className="text-muted text-sm mt-1">{n.body}</p>
                      <span className="text-xs text-muted mt-2 block">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead({ notificationId: n._id as Id<"notifications"> })}
                        className="shrink-0 p-2 rounded-lg hover:bg-surface-2 transition-colors text-muted hover:text-foreground"
                        title="تعيين كمقروء"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface-1 border border-card-border rounded-2xl p-12 text-center">
          <Bell size={48} className="text-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">لا توجد إشعارات</h3>
          <p className="text-muted text-sm">ستظهر الإشعارات هنا عند وصولها.</p>
        </div>
      )}
    </div>
  );
}
