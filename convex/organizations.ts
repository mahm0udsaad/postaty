import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const planValidator = v.union(
  v.literal("free"),
  v.literal("starter"),
  v.literal("pro"),
  v.literal("agency")
);

/** Plan limits configuration */
const PLAN_LIMITS = {
  free: {
    creditsMonthly: 10,
    maxConcurrentGenerations: 1,
    maxBrandKits: 1,
    maxCustomTemplates: 0,
  },
  starter: {
    creditsMonthly: 100,
    maxConcurrentGenerations: 2,
    maxBrandKits: 3,
    maxCustomTemplates: 5,
  },
  pro: {
    creditsMonthly: 500,
    maxConcurrentGenerations: 5,
    maxBrandKits: 10,
    maxCustomTemplates: 999,
  },
  agency: {
    creditsMonthly: 2000,
    maxConcurrentGenerations: 10,
    maxBrandKits: 50,
    maxCustomTemplates: 999,
  },
} as const;

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    plan: v.optional(planValidator),
  },
  handler: async (ctx, args) => {
    // Check slug uniqueness
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error(`Organization slug "${args.slug}" is taken`);

    const plan = args.plan ?? "free";
    const limits = PLAN_LIMITS[plan];

    return await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      plan,
      creditsBalance: limits.creditsMonthly,
      creditsMonthlyAllowance: limits.creditsMonthly,
      currentPeriodStart: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orgId);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const updatePlan = mutation({
  args: {
    orgId: v.id("organizations"),
    plan: planValidator,
  },
  handler: async (ctx, args) => {
    const limits = PLAN_LIMITS[args.plan];
    await ctx.db.patch(args.orgId, {
      plan: args.plan,
      creditsMonthlyAllowance: limits.creditsMonthly,
    });
  },
});

export const getPlanLimits = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) return null;
    return {
      ...PLAN_LIMITS[org.plan],
      plan: org.plan,
      creditsBalance: org.creditsBalance,
    };
  },
});
