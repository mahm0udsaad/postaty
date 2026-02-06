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
