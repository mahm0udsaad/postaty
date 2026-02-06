import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const write = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("audit_logs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listByOrg = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
    action: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.action) {
      return await ctx.db
        .query("audit_logs")
        .withIndex("by_action", (q) => q.eq("action", args.action!))
        .filter((q) => q.eq(q.field("orgId"), args.orgId))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("audit_logs")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(limit);
  },
});
