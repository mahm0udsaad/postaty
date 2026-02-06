import { mutation } from "./_generated/server";

export const seedDev = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if dev org already exists
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", "dev-org"))
      .first();

    if (existing) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_orgId", (q) => q.eq("orgId", existing._id))
        .first();
      return { orgId: existing._id, userId: user?._id };
    }

    const orgId = await ctx.db.insert("organizations", {
      name: "Dev Organization",
      slug: "dev-org",
      plan: "pro",
      creditsBalance: 9999,
      creditsMonthlyAllowance: 9999,
      currentPeriodStart: Date.now(),
      createdAt: Date.now(),
    });

    const userId = await ctx.db.insert("users", {
      clerkId: "dev_user_001",
      email: "dev@example.com",
      name: "Dev User",
      orgId,
      role: "owner",
      createdAt: Date.now(),
    });

    return { orgId, userId };
  },
});
