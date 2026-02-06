import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const paletteValidator = v.object({
  primary: v.string(),
  secondary: v.string(),
  accent: v.string(),
  background: v.string(),
  text: v.string(),
});

export const save = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    logoStorageId: v.optional(v.id("_storage")),
    palette: paletteValidator,
    extractedColors: v.array(v.string()),
    fontFamily: v.string(),
    styleAdjectives: v.array(v.string()),
    doRules: v.array(v.string()),
    dontRules: v.array(v.string()),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    // If setting as default, unset any existing defaults for this org
    if (args.isDefault) {
      const existing = await ctx.db
        .query("brand_kits")
        .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
        .filter((q) => q.eq(q.field("isDefault"), true))
        .collect();

      for (const kit of existing) {
        await ctx.db.patch(kit._id, { isDefault: false });
      }
    }

    return await ctx.db.insert("brand_kits", {
      ...args,
      styleSeed: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    brandKitId: v.id("brand_kits"),
    name: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    palette: v.optional(paletteValidator),
    extractedColors: v.optional(v.array(v.string())),
    fontFamily: v.optional(v.string()),
    styleAdjectives: v.optional(v.array(v.string())),
    doRules: v.optional(v.array(v.string())),
    dontRules: v.optional(v.array(v.string())),
    styleSeed: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { brandKitId, ...updates } = args;
    const kit = await ctx.db.get(brandKitId);
    if (!kit) throw new Error("Brand kit not found");

    // If setting as default, unset any existing defaults for this org
    if (updates.isDefault) {
      const existing = await ctx.db
        .query("brand_kits")
        .withIndex("by_orgId", (q) => q.eq("orgId", kit.orgId))
        .filter((q) => q.eq(q.field("isDefault"), true))
        .collect();

      for (const other of existing) {
        if (other._id !== brandKitId) {
          await ctx.db.patch(other._id, { isDefault: false });
        }
      }
    }

    // Filter out undefined values
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(brandKitId, patch);
  },
});

export const remove = mutation({
  args: { brandKitId: v.id("brand_kits") },
  handler: async (ctx, args) => {
    const kit = await ctx.db.get(args.brandKitId);
    if (!kit) throw new Error("Brand kit not found");

    // Delete logo from storage if it exists
    if (kit.logoStorageId) {
      await ctx.storage.delete(kit.logoStorageId);
    }

    await ctx.db.delete(args.brandKitId);
  },
});

export const get = query({
  args: { brandKitId: v.id("brand_kits") },
  handler: async (ctx, args) => {
    const kit = await ctx.db.get(args.brandKitId);
    if (!kit) return null;

    const logoUrl = kit.logoStorageId
      ? await ctx.storage.getUrl(kit.logoStorageId)
      : null;

    return { ...kit, logoUrl };
  },
});

export const getDefault = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const kit = await ctx.db
      .query("brand_kits")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();

    if (!kit) return null;

    const logoUrl = kit.logoStorageId
      ? await ctx.storage.getUrl(kit.logoStorageId)
      : null;

    return { ...kit, logoUrl };
  },
});

export const listByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const kits = await ctx.db
      .query("brand_kits")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    return Promise.all(
      kits.map(async (kit) => ({
        ...kit,
        logoUrl: kit.logoStorageId
          ? await ctx.storage.getUrl(kit.logoStorageId)
          : null,
      }))
    );
  },
});

export const setStyleSeed = mutation({
  args: {
    brandKitId: v.id("brand_kits"),
    styleSeed: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.brandKitId, {
      styleSeed: args.styleSeed,
      updatedAt: Date.now(),
    });
  },
});
