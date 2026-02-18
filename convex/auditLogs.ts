import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireCurrentUser } from "./auth";

export const write = mutation({
  args: {
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    return await ctx.db.insert("audit_logs", {
      orgId: currentUser.orgId,
      userId: currentUser._id,
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listByOrg = query({
  args: {
    limit: v.optional(v.number()),
    action: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    const limit = args.limit ?? 50;

    if (args.action) {
      return await ctx.db
        .query("audit_logs")
        .withIndex("by_action", (q) => q.eq("action", args.action!))
        .filter((q) => q.eq(q.field("orgId"), currentUser.orgId))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("audit_logs")
      .withIndex("by_orgId", (q) => q.eq("orgId", currentUser.orgId))
      .order("desc")
      .take(limit);
  },
});
