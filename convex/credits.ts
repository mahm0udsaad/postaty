import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const reasonValidator = v.union(
  v.literal("generation"),
  v.literal("refund"),
  v.literal("purchase"),
  v.literal("monthly_allowance"),
  v.literal("admin_adjustment")
);

/**
 * Debit credits from an organization's balance.
 * Performs atomic balance check + debit to prevent over-spending.
 * Returns the ledger entry ID, or throws if insufficient credits.
 */
export const debit = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    amount: v.number(),
    reason: reasonValidator,
    generationId: v.optional(v.id("generations")),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Debit amount must be positive");

    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    if (org.creditsBalance < args.amount) {
      throw new Error(
        `Insufficient credits: ${org.creditsBalance} available, ${args.amount} required`
      );
    }

    const newBalance = org.creditsBalance - args.amount;

    // Atomic: update org balance + create ledger entry
    await ctx.db.patch(args.orgId, { creditsBalance: newBalance });

    return await ctx.db.insert("credits_ledger", {
      orgId: args.orgId,
      userId: args.userId,
      amount: -args.amount,
      reason: args.reason,
      generationId: args.generationId,
      balanceAfter: newBalance,
      createdAt: Date.now(),
    });
  },
});

/**
 * Credit (add) credits to an organization's balance.
 */
export const credit = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    amount: v.number(),
    reason: reasonValidator,
    generationId: v.optional(v.id("generations")),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Credit amount must be positive");

    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    const newBalance = org.creditsBalance + args.amount;

    await ctx.db.patch(args.orgId, { creditsBalance: newBalance });

    return await ctx.db.insert("credits_ledger", {
      orgId: args.orgId,
      userId: args.userId,
      amount: args.amount,
      reason: args.reason,
      generationId: args.generationId,
      balanceAfter: newBalance,
      createdAt: Date.now(),
    });
  },
});

/**
 * Refund credits for a failed generation.
 */
export const refundGeneration = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    generationId: v.id("generations"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw new Error("Refund amount must be positive");

    // Check that no refund already exists for this generation
    const existingRefund = await ctx.db
      .query("credits_ledger")
      .withIndex("by_generationId", (q) =>
        q.eq("generationId", args.generationId)
      )
      .filter((q) => q.eq(q.field("reason"), "refund"))
      .first();

    if (existingRefund) {
      throw new Error("Refund already issued for this generation");
    }

    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    const newBalance = org.creditsBalance + args.amount;

    await ctx.db.patch(args.orgId, { creditsBalance: newBalance });

    return await ctx.db.insert("credits_ledger", {
      orgId: args.orgId,
      userId: args.userId,
      amount: args.amount,
      reason: "refund",
      generationId: args.generationId,
      balanceAfter: newBalance,
      createdAt: Date.now(),
    });
  },
});

export const getBalance = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) return null;
    return {
      balance: org.creditsBalance,
      monthlyAllowance: org.creditsMonthlyAllowance,
      plan: org.plan,
    };
  },
});

export const getLedger = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("credits_ledger")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(limit);
  },
});
