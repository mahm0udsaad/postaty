import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_clerkUserId_isRead", (q) =>
        q.eq("clerkUserId", identity.subject).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.clerkUserId !== identity.subject) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_clerkUserId_isRead", (q) =>
        q.eq("clerkUserId", identity.subject).eq("isRead", false)
      )
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});
