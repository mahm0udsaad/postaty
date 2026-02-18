import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

// ── Admin guard helper ─────────────────────────────────────────────

type AdminGuardResult = {
  clerkUserId: string;
  user: {
    clerkId: string;
    role: "owner" | "admin" | "member";
  };
};

async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<AdminGuardResult> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Not authenticated");
  const clerkUserId = identity.subject;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkUserId))
    .first();

  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    throw new Error("Admin access required");
  }

  return {
    clerkUserId,
    user: {
      clerkId: user.clerkId,
      role: user.role,
    },
  };
}

// ── AI Overview Metrics ────────────────────────────────────────────

export const getAiOverview = query({
  args: {
    periodDays: v.optional(v.number()), // default 30
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const periodMs = (args.periodDays ?? 30) * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - periodMs;

    const allEvents = await ctx.db
      .query("aiUsageEvents")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    const periodEvents = allEvents.filter((e) => e.createdAt >= cutoff);

    // By model
    const byModel: Record<string, { count: number; cost: number; images: number; avgDurationMs: number; totalDuration: number }> = {};
    for (const e of periodEvents) {
      if (!byModel[e.model]) {
        byModel[e.model] = { count: 0, cost: 0, images: 0, avgDurationMs: 0, totalDuration: 0 };
      }
      byModel[e.model].count++;
      byModel[e.model].cost += e.estimatedCostUsd;
      byModel[e.model].images += e.imagesGenerated;
      byModel[e.model].totalDuration += e.durationMs;
    }
    for (const key of Object.keys(byModel)) {
      byModel[key].avgDurationMs = byModel[key].count > 0
        ? byModel[key].totalDuration / byModel[key].count
        : 0;
    }

    const totalRequests = periodEvents.length;
    const successCount = periodEvents.filter((e) => e.success).length;
    const failureCount = totalRequests - successCount;
    const totalCostUsd = periodEvents.reduce((sum, e) => sum + e.estimatedCostUsd, 0);
    const totalImages = periodEvents.reduce((sum, e) => sum + e.imagesGenerated, 0);

    return {
      periodDays: args.periodDays ?? 30,
      totalRequests,
      successCount,
      failureCount,
      successRate: totalRequests > 0 ? successCount / totalRequests : 0,
      totalCostUsd,
      totalImages,
      byModel,
    };
  },
});

// ── Financial Metrics (Profit) ─────────────────────────────────────

export const getFinancialOverview = query({
  args: {
    periodDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const periodMs = (args.periodDays ?? 30) * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - periodMs;

    // Settled/recorded Stripe revenue from webhook events.
    const revenueEvents = await ctx.db
      .query("stripeRevenueEvents")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
    const periodRevenueEvents = revenueEvents.filter((e) => e.createdAt >= cutoff);

    // Current implementation reports USD totals from tracked Stripe events.
    const usdRevenueEvents = periodRevenueEvents.filter((e) => e.currency === "USD");
    const totalGrossRevenue =
      usdRevenueEvents.reduce((sum, e) => sum + e.amountCents, 0) / 100;
    const estimatedStripeFees =
      usdRevenueEvents.reduce((sum, e) => sum + e.estimatedStripeFeeCents, 0) / 100;

    // MRR remains an estimate based on active subscription plans.
    const allBilling = await ctx.db.query("billing").collect();
    const activeSubs = allBilling.filter(
      (b) => b.status === "active" || b.status === "trialing"
    );

    // Plan pricing (approximate monthly USD)
    const planPricing: Record<string, number> = {
      starter: 9.99,
      growth: 19.99,
      dominant: 49.99,
      none: 0,
    };

    const monthlySubRevenue = activeSubs.reduce(
      (sum, b) => sum + (planPricing[b.planKey] ?? 0),
      0
    );

    // AI usage cost
    const allUsage = await ctx.db
      .query("aiUsageEvents")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    const periodUsage = allUsage.filter((e) => e.createdAt >= cutoff);
    const apiCostUsd = periodUsage.reduce((sum, e) => sum + e.estimatedCostUsd, 0);

    const netProfit = totalGrossRevenue - estimatedStripeFees - apiCostUsd;

    return {
      periodDays: args.periodDays ?? 30,
      grossRevenue: totalGrossRevenue,
      estimatedStripeFees,
      apiCostUsd,
      netProfit,
      activeSubscriptions: activeSubs.length,
      subscriptionsByPlan: {
        starter: activeSubs.filter((b) => b.planKey === "starter").length,
        growth: activeSubs.filter((b) => b.planKey === "growth").length,
        dominant: activeSubs.filter((b) => b.planKey === "dominant").length,
      },
      mrr: monthlySubRevenue,
    };
  },
});

// ── Users List (Admin) ─────────────────────────────────────────────

export const listUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const users = await ctx.db
      .query("users")
      .order("desc")
      .take(args.limit ?? 100);

    // Enrich with billing data
    const enriched = await Promise.all(
      users.map(async (user) => {
        const billing = await ctx.db
          .query("billing")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", user.clerkId))
          .first();

        const usageEvents = await ctx.db
          .query("aiUsageEvents")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", user.clerkId))
          .collect();

        return {
          ...user,
          effectiveStatus: user.status ?? "active",
          billing: billing
            ? {
                planKey: billing.planKey,
                status: billing.status,
                monthlyCreditsUsed: billing.monthlyCreditsUsed,
                monthlyCreditLimit: billing.monthlyCreditLimit,
                addonCreditsBalance: billing.addonCreditsBalance,
              }
            : null,
          totalGenerations: usageEvents.length,
          totalCostUsd: usageEvents.reduce((sum, e) => sum + e.estimatedCostUsd, 0),
        };
      })
    );

    return enriched;
  },
});

// ── Subscriptions List (Admin) ─────────────────────────────────────

export const listSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allBilling = await ctx.db.query("billing").collect();

    const withUsers = await Promise.all(
      allBilling.map(async (billing) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", billing.clerkUserId))
          .first();

        return {
          ...billing,
          userName: user?.name ?? "Unknown",
          userEmail: user?.email ?? "Unknown",
        };
      })
    );

    return {
      subscriptions: withUsers,
      summary: {
        total: allBilling.length,
        active: allBilling.filter((b) => b.status === "active").length,
        trialing: allBilling.filter((b) => b.status === "trialing").length,
        pastDue: allBilling.filter((b) => b.status === "past_due").length,
        canceled: allBilling.filter((b) => b.status === "canceled").length,
      },
    };
  },
});

// ── Feedback (Likes/Dislikes) ──────────────────────────────────────

export const submitFeedback = mutation({
  args: {
    rating: v.union(v.literal("like"), v.literal("dislike")),
    comment: v.optional(v.string()),
    model: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("restaurant"),
        v.literal("supermarket"),
        v.literal("ecommerce"),
        v.literal("services"),
        v.literal("fashion"),
        v.literal("beauty"),
        v.literal("online") // legacy
      )
    ),
    generationId: v.optional(v.id("generations")),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");

    return await ctx.db.insert("feedback", {
      clerkUserId: identity.subject,
      generationId: args.generationId,
      rating: args.rating,
      comment: args.comment,
      model: args.model,
      category: args.category,
      imageStorageId: args.imageStorageId,
      createdAt: Date.now(),
    });
  },
});

export const listFeedback = query({
  args: {
    rating: v.optional(v.union(v.literal("like"), v.literal("dislike"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let feedbackQuery;
    if (args.rating) {
      feedbackQuery = ctx.db
        .query("feedback")
        .withIndex("by_rating", (q) => q.eq("rating", args.rating!))
        .order("desc");
    } else {
      feedbackQuery = ctx.db
        .query("feedback")
        .withIndex("by_createdAt")
        .order("desc");
    }

    const items = await feedbackQuery.take(args.limit ?? 100);

    // Enrich with user info
    const enriched = await Promise.all(
      items.map(async (item) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", item.clerkUserId))
          .first();
        return {
          ...item,
          userName: user?.name ?? "Unknown",
          userEmail: user?.email ?? "Unknown",
        };
      })
    );

    return enriched;
  },
});

export const getFeedbackSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allFeedback = await ctx.db.query("feedback").collect();
    const likes = allFeedback.filter((f) => f.rating === "like").length;
    const dislikes = allFeedback.filter((f) => f.rating === "dislike").length;

    return {
      total: allFeedback.length,
      likes,
      dislikes,
      likeRate: allFeedback.length > 0 ? likes / allFeedback.length : 0,
    };
  },
});

// ── Support Tickets ────────────────────────────────────────────────

export const createSupportTicket = mutation({
  args: {
    subject: v.string(),
    body: v.string(),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("urgent")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");

    const now = Date.now();
    const ticketId = await ctx.db.insert("supportTickets", {
      clerkUserId: identity.subject,
      subject: args.subject,
      status: "open",
      priority: args.priority ?? "medium",
      assignedTo: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("supportMessages", {
      ticketId,
      senderClerkUserId: identity.subject,
      isAdmin: false,
      body: args.body,
      createdAt: now,
    });

    return ticketId;
  },
});

export const listSupportTickets = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("waiting_on_customer"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let ticketQuery;
    if (args.status) {
      ticketQuery = ctx.db
        .query("supportTickets")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc");
    } else {
      ticketQuery = ctx.db
        .query("supportTickets")
        .withIndex("by_createdAt")
        .order("desc");
    }

    const tickets = await ticketQuery.take(args.limit ?? 100);

    const enriched = await Promise.all(
      tickets.map(async (ticket) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", ticket.clerkUserId))
          .first();

        const messages = await ctx.db
          .query("supportMessages")
          .withIndex("by_ticketId", (q) => q.eq("ticketId", ticket._id))
          .collect();

        return {
          ...ticket,
          userName: user?.name ?? "Unknown",
          userEmail: user?.email ?? "Unknown",
          messageCount: messages.length,
          lastMessageAt: messages.length > 0
            ? messages[messages.length - 1].createdAt
            : ticket.createdAt,
        };
      })
    );

    return enriched;
  },
});

export const getSupportTicketThread = query({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const messages = await ctx.db
      .query("supportMessages")
      .withIndex("by_ticketId", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", ticket.clerkUserId))
      .first();

    return {
      ticket: {
        ...ticket,
        userName: user?.name ?? "Unknown",
        userEmail: user?.email ?? "Unknown",
      },
      messages,
    };
  },
});

export const replySupportTicket = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    body: v.string(),
    newStatus: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("waiting_on_customer"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx);

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const now = Date.now();

    await ctx.db.insert("supportMessages", {
      ticketId: args.ticketId,
      senderClerkUserId: user.clerkId,
      isAdmin: true,
      body: args.body,
      createdAt: now,
    });

    await ctx.db.patch(args.ticketId, {
      status: args.newStatus ?? "in_progress",
      updatedAt: now,
    });
  },
});

export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("waiting_on_customer"),
      v.literal("resolved"),
      v.literal("closed")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.ticketId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const assignTicket = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    assignedTo: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.ticketId, {
      assignedTo: args.assignedTo,
      updatedAt: Date.now(),
    });
  },
});

// ── Admin Role Management ──────────────────────────────────────────

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireAdmin(ctx);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");

    // Cannot demote an owner
    if (targetUser.role === "owner") {
      throw new Error("Cannot change the role of an owner");
    }

    await ctx.db.patch(args.userId, { role: args.role });

    // Audit log
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkUserId))
      .first();
    if (adminUser) {
      await ctx.db.insert("audit_logs", {
        orgId: targetUser.orgId,
        userId: adminUser._id,
        action: "update_user_role",
        resourceType: "users",
        resourceId: args.userId,
        metadata: JSON.stringify({ newRole: args.role, previousRole: targetUser.role }),
        createdAt: Date.now(),
      });
    }
  },
});

// ── Bootstrap Admin ────────────────────────────────────────────────
// Promotes the current user to owner.
// - If no admin/owner exists: works without a secret.
// - If an admin/owner already exists: requires ADMIN_BOOTSTRAP_SECRET env var.

export const bootstrapAdmin = mutation({
  args: {
    secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");
    const clerkUserId = identity.subject;

    // Check if any admin/owner already exists
    const allUsers = await ctx.db.query("users").collect();
    const hasAdmin = allUsers.some(
      (u) => u.role === "admin" || u.role === "owner"
    );

    if (hasAdmin) {
      // Require secret to override
      const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
      if (!expectedSecret) {
        throw new Error(
          "Admin already exists and ADMIN_BOOTSTRAP_SECRET env var is not set. " +
          "Set it in your Convex environment to allow promotion."
        );
      }
      if (!args.secret || args.secret !== expectedSecret) {
        throw new Error("Invalid bootstrap secret.");
      }
    }

    // Find or create the user record
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkUserId))
      .first();

    if (user) {
      if (user.role === "owner") {
        return { userId: user._id, action: "already_owner" };
      }
      await ctx.db.patch(user._id, { role: "owner" });
      return { userId: user._id, action: "promoted" };
    }

    // User doesn't exist in users table — create with a default org
    let org = await ctx.db.query("organizations").first();
    if (!org) {
      const orgId = await ctx.db.insert("organizations", {
        name: "Default",
        slug: "default",
        plan: "free",
        creditsBalance: 10,
        creditsMonthlyAllowance: 10,
        currentPeriodStart: Date.now(),
        createdAt: Date.now(),
      });
      org = await ctx.db.get(orgId);
    }

    const userId = await ctx.db.insert("users", {
      clerkId: clerkUserId,
      email: identity.email ?? "",
      name: identity.name ?? "Admin",
      orgId: org!._id,
      role: "owner",
      createdAt: Date.now(),
    });

    return { userId, action: "created" };
  },
});

// ── Daily Usage Aggregation (for charts) ───────────────────────────

export const getDailyUsage = query({
  args: {
    periodDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const periodMs = (args.periodDays ?? 30) * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - periodMs;

    const events = await ctx.db
      .query("aiUsageEvents")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    const periodEvents = events.filter((e) => e.createdAt >= cutoff);

    // Group by day
    const daily: Record<string, { date: string; requests: number; cost: number; images: number; failures: number }> = {};

    for (const e of periodEvents) {
      const date = new Date(e.createdAt).toISOString().split("T")[0];
      if (!daily[date]) {
        daily[date] = { date, requests: 0, cost: 0, images: 0, failures: 0 };
      }
      daily[date].requests++;
      daily[date].cost += e.estimatedCostUsd;
      daily[date].images += e.imagesGenerated;
      if (!e.success) daily[date].failures++;
    }

    return Object.values(daily).sort((a, b) => a.date.localeCompare(b.date));
  },
});

// ── User Status Management (Suspend / Ban / Reinstate) ────────────

export const suspendUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireAdmin(ctx);

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target.role === "owner") throw new Error("Cannot suspend an owner");
    if (target.clerkId === clerkUserId) throw new Error("Cannot suspend yourself");

    const now = Date.now();
    await ctx.db.patch(args.userId, {
      status: "suspended",
      statusReason: args.reason,
      statusUpdatedAt: now,
    });

    // Audit log
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkUserId))
      .first();
    if (adminUser) {
      await ctx.db.insert("audit_logs", {
        orgId: target.orgId,
        userId: adminUser._id,
        action: "suspend_user",
        resourceType: "users",
        resourceId: args.userId,
        metadata: JSON.stringify({ reason: args.reason }),
        createdAt: now,
      });
    }

    // Auto-notify user
    await ctx.db.insert("notifications", {
      clerkUserId: target.clerkId,
      title: "تم إيقاف حسابك",
      body: args.reason,
      type: "warning",
      isRead: false,
      createdAt: now,
    });
  },
});

export const banUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireAdmin(ctx);

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target.role === "owner") throw new Error("Cannot ban an owner");
    if (target.clerkId === clerkUserId) throw new Error("Cannot ban yourself");

    const now = Date.now();
    await ctx.db.patch(args.userId, {
      status: "banned",
      statusReason: args.reason,
      statusUpdatedAt: now,
    });

    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkUserId))
      .first();
    if (adminUser) {
      await ctx.db.insert("audit_logs", {
        orgId: target.orgId,
        userId: adminUser._id,
        action: "ban_user",
        resourceType: "users",
        resourceId: args.userId,
        metadata: JSON.stringify({ reason: args.reason }),
        createdAt: now,
      });
    }

    await ctx.db.insert("notifications", {
      clerkUserId: target.clerkId,
      title: "تم حظر حسابك",
      body: args.reason,
      type: "warning",
      isRead: false,
      createdAt: now,
    });
  },
});

export const reinstateUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireAdmin(ctx);

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");

    const now = Date.now();
    await ctx.db.patch(args.userId, {
      status: "active",
      statusReason: undefined,
      statusUpdatedAt: now,
    });

    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkUserId))
      .first();
    if (adminUser) {
      await ctx.db.insert("audit_logs", {
        orgId: target.orgId,
        userId: adminUser._id,
        action: "reinstate_user",
        resourceType: "users",
        resourceId: args.userId,
        metadata: JSON.stringify({ previousStatus: target.status ?? "active" }),
        createdAt: now,
      });
    }

    await ctx.db.insert("notifications", {
      clerkUserId: target.clerkId,
      title: "تم إعادة تفعيل حسابك",
      body: "تمت إعادة تفعيل حسابك بنجاح. يمكنك الآن استخدام جميع الخدمات.",
      type: "success",
      isRead: false,
      createdAt: now,
    });
  },
});

// ── Add Credits ───────────────────────────────────────────────────

export const addCreditsToUser = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireAdmin(ctx);

    if (args.amount <= 0) throw new Error("Amount must be positive");

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");

    const billing = await ctx.db
      .query("billing")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", target.clerkId))
      .first();

    if (!billing) throw new Error("No billing record found for this user");

    const newAddonBalance = billing.addonCreditsBalance + args.amount;
    await ctx.db.patch(billing._id, {
      addonCreditsBalance: newAddonBalance,
      updatedAt: Date.now(),
    });

    // Credit ledger entry
    const now = Date.now();
    await ctx.db.insert("creditLedger", {
      clerkUserId: target.clerkId,
      billingId: billing._id,
      amount: args.amount,
      reason: "manual_adjustment",
      source: "system",
      monthlyCreditsUsedAfter: billing.monthlyCreditsUsed,
      addonCreditsBalanceAfter: newAddonBalance,
      createdAt: now,
    });

    // Audit log
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkUserId))
      .first();
    if (adminUser) {
      await ctx.db.insert("audit_logs", {
        orgId: target.orgId,
        userId: adminUser._id,
        action: "add_credits",
        resourceType: "billing",
        resourceId: billing._id,
        metadata: JSON.stringify({ amount: args.amount, reason: args.reason }),
        createdAt: now,
      });
    }

    // Notify user
    await ctx.db.insert("notifications", {
      clerkUserId: target.clerkId,
      title: "تمت إضافة أرصدة",
      body: `تمت إضافة ${args.amount} رصيد إلى حسابك. السبب: ${args.reason}`,
      type: "credit",
      isRead: false,
      metadata: JSON.stringify({ amount: args.amount }),
      createdAt: now,
    });
  },
});

// ── Send Notification ─────────────────────────────────────────────

export const sendNotification = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("success"),
      v.literal("credit"),
      v.literal("system")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");

    await ctx.db.insert("notifications", {
      clerkUserId: target.clerkId,
      title: args.title,
      body: args.body,
      type: args.type,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const sendBulkNotification = mutation({
  args: {
    userIds: v.array(v.id("users")),
    title: v.string(),
    body: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("success"),
      v.literal("credit"),
      v.literal("system")
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const now = Date.now();
    for (const userId of args.userIds) {
      const target = await ctx.db.get(userId);
      if (!target) continue;

      await ctx.db.insert("notifications", {
        clerkUserId: target.clerkId,
        title: args.title,
        body: args.body,
        type: args.type,
        isRead: false,
        createdAt: now,
      });
    }
  },
});
