import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema(
  {
    // ── Auth & Multi-tenancy ─────────────────────────────────────────
    users: defineTable({
      clerkId: v.string(),
      email: v.string(),
      name: v.string(),
      orgId: v.id("organizations"),
      role: v.union(
        v.literal("owner"),
        v.literal("admin"),
        v.literal("member")
      ),
      createdAt: v.number(),
    })
      .index("by_clerkId", ["clerkId"])
      .index("by_orgId", ["orgId"]),

    organizations: defineTable({
      name: v.string(),
      slug: v.string(),
      plan: v.union(
        v.literal("free"),
        v.literal("starter"),
        v.literal("pro"),
        v.literal("agency")
      ),
      creditsBalance: v.number(),
      creditsMonthlyAllowance: v.number(),
      currentPeriodStart: v.number(),
      createdAt: v.number(),
    }).index("by_slug", ["slug"]),

    // ── Brand Kits ───────────────────────────────────────────────────
    brand_kits: defineTable({
      orgId: v.id("organizations"),
      name: v.string(),
      logoStorageId: v.optional(v.id("_storage")),
      palette: v.object({
        primary: v.string(),
        secondary: v.string(),
        accent: v.string(),
        background: v.string(),
        text: v.string(),
      }),
      extractedColors: v.array(v.string()),
      fontFamily: v.string(),
      styleAdjectives: v.array(v.string()),
      doRules: v.array(v.string()),
      dontRules: v.array(v.string()),
      styleSeed: v.optional(v.string()),
      isDefault: v.boolean(),
      updatedAt: v.number(),
    }).index("by_orgId", ["orgId"]),

    // ── Templates ────────────────────────────────────────────────────
    templates: defineTable({
      slug: v.string(),
      name: v.string(),
      nameAr: v.string(),
      category: v.union(
        v.literal("sale"),
        v.literal("new_arrival"),
        v.literal("minimal"),
        v.literal("luxury"),
        v.literal("ramadan"),
        v.literal("eid"),
        v.literal("food"),
        v.literal("electronics"),
        v.literal("fashion"),
        v.literal("general")
      ),
      supportedFormats: v.array(v.string()),
      layers: v.array(
        v.object({
          id: v.string(),
          type: v.union(
            v.literal("background"),
            v.literal("image"),
            v.literal("logo"),
            v.literal("text"),
            v.literal("shape"),
            v.literal("badge")
          ),
          label: v.string(),
          labelAr: v.string(),
          x: v.number(),
          y: v.number(),
          width: v.number(),
          height: v.number(),
          rotation: v.number(),
          zIndex: v.number(),
          visible: v.boolean(),
          locked: v.boolean(),
          props: v.any(),
        })
      ),
      previewStorageId: v.optional(v.id("_storage")),
      isSystem: v.boolean(),
      orgId: v.optional(v.id("organizations")),
      parentTemplateId: v.optional(v.id("templates")),
      parentVersion: v.optional(v.number()),
      version: v.number(),
      locales: v.array(v.string()),
      createdAt: v.number(),
    })
      .index("by_slug", ["slug"])
      .index("by_category", ["category"])
      .index("by_orgId", ["orgId"])
      .index("by_isSystem", ["isSystem"]),

    // ── Generations ──────────────────────────────────────────────────
    generations: defineTable({
      orgId: v.id("organizations"),
      userId: v.id("users"),
      brandKitId: v.optional(v.id("brand_kits")),
      templateId: v.optional(v.id("templates")),
      category: v.union(
        v.literal("restaurant"),
        v.literal("supermarket"),
        v.literal("online")
      ),
      businessName: v.string(),
      productName: v.string(),
      inputs: v.string(),
      promptUsed: v.string(),
      outputs: v.array(
        v.object({
          format: v.string(),
          storageId: v.optional(v.id("_storage")),
          width: v.number(),
          height: v.number(),
        })
      ),
      status: v.union(
        v.literal("queued"),
        v.literal("processing"),
        v.literal("complete"),
        v.literal("partial"),
        v.literal("failed")
      ),
      creditsCharged: v.number(),
      durationMs: v.optional(v.number()),
      error: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_orgId", ["orgId"])
      .index("by_userId", ["userId"])
      .index("by_status", ["status"])
      .index("by_category", ["category"]),

    // ── Stripe Billing ──────────────────────────────────────────────
    billing: defineTable({
      clerkUserId: v.string(),
      stripeCustomerId: v.optional(v.string()),
      stripeSubscriptionId: v.optional(v.string()),
      planKey: v.union(
        v.literal("none"),
        v.literal("starter"),
        v.literal("growth"),
        v.literal("dominant")
      ),
      status: v.union(
        v.literal("none"),
        v.literal("trialing"),
        v.literal("active"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("unpaid"),
        v.literal("incomplete"),
        v.literal("incomplete_expired")
      ),
      currentPeriodStart: v.optional(v.number()),
      currentPeriodEnd: v.optional(v.number()),
      monthlyCreditLimit: v.number(),
      monthlyCreditsUsed: v.number(),
      addonCreditsBalance: v.number(),
      updatedAt: v.number(),
      createdAt: v.number(),
    })
      .index("by_clerkUserId", ["clerkUserId"])
      .index("by_stripeCustomerId", ["stripeCustomerId"])
      .index("by_stripeSubscriptionId", ["stripeSubscriptionId"]),

    stripeEvents: defineTable({
      eventId: v.string(),
      type: v.string(),
      status: v.union(
        v.literal("processing"),
        v.literal("processed"),
        v.literal("failed")
      ),
      error: v.optional(v.string()),
      processedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_eventId", ["eventId"]),

    creditLedger: defineTable({
      clerkUserId: v.string(),
      billingId: v.optional(v.id("billing")),
      amount: v.number(),
      reason: v.union(
        v.literal("usage"),
        v.literal("monthly_reset"),
        v.literal("addon_purchase"),
        v.literal("manual_adjustment")
      ),
      source: v.union(
        v.literal("monthly"),
        v.literal("addon"),
        v.literal("system")
      ),
      stripeEventId: v.optional(v.string()),
      stripeCheckoutSessionId: v.optional(v.string()),
      idempotencyKey: v.optional(v.string()),
      monthlyCreditsUsedAfter: v.number(),
      addonCreditsBalanceAfter: v.number(),
      createdAt: v.number(),
    })
      .index("by_clerkUserId", ["clerkUserId"])
      .index("by_stripeEventId", ["stripeEventId"])
      .index("by_idempotencyKey", ["idempotencyKey"]),

    // ── Credits Ledger ───────────────────────────────────────────────
    credits_ledger: defineTable({
      orgId: v.id("organizations"),
      userId: v.id("users"),
      amount: v.number(),
      reason: v.union(
        v.literal("generation"),
        v.literal("refund"),
        v.literal("purchase"),
        v.literal("monthly_allowance"),
        v.literal("admin_adjustment")
      ),
      generationId: v.optional(v.id("generations")),
      balanceAfter: v.number(),
      createdAt: v.number(),
    })
      .index("by_orgId", ["orgId"])
      .index("by_generationId", ["generationId"]),

    // ── Poster Templates (AI-generated designs for reuse) ────────────
    poster_templates: defineTable({
      orgId: v.id("organizations"),
      userId: v.id("users"),
      name: v.string(),
      nameAr: v.string(),
      description: v.string(),
      category: v.union(
        v.literal("restaurant"),
        v.literal("supermarket"),
        v.literal("online")
      ),
      style: v.string(),
      designJson: v.string(),
      previewStorageId: v.optional(v.id("_storage")),
      isPublic: v.boolean(),
      usageCount: v.number(),
      createdAt: v.number(),
    })
      .index("by_orgId", ["orgId"])
      .index("by_category", ["category"])
      .index("by_isPublic", ["isPublic"]),

    // ── Poster Jobs (real-time generation tracking) ─────────────────
    poster_jobs: defineTable({
      orgId: v.id("organizations"),
      userId: v.id("users"),
      generationId: v.optional(v.id("generations")),
      category: v.union(
        v.literal("restaurant"),
        v.literal("supermarket"),
        v.literal("online")
      ),
      formDataJson: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("generating-designs"),
        v.literal("rendering"),
        v.literal("complete"),
        v.literal("error")
      ),
      designsJson: v.optional(v.string()),
      results: v.array(
        v.object({
          designIndex: v.number(),
          format: v.string(),
          status: v.union(
            v.literal("pending"),
            v.literal("rendering"),
            v.literal("complete"),
            v.literal("error")
          ),
          storageId: v.optional(v.id("_storage")),
          error: v.optional(v.string()),
        })
      ),
      totalDesigns: v.number(),
      completedDesigns: v.number(),
      error: v.optional(v.string()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
    })
      .index("by_orgId", ["orgId"])
      .index("by_userId", ["userId"])
      .index("by_status", ["status"]),

    // ── Audit Logs ───────────────────────────────────────────────────
    audit_logs: defineTable({
      orgId: v.id("organizations"),
      userId: v.id("users"),
      action: v.string(),
      resourceType: v.string(),
      resourceId: v.string(),
      metadata: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_orgId", ["orgId"])
      .index("by_action", ["action"]),
  },
  { schemaValidation: true }
);
