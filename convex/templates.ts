import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireCurrentUser } from "./auth";

const categoryValidator = v.union(
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
);

const layerValidator = v.object({
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
});

export const create = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    nameAr: v.string(),
    category: categoryValidator,
    supportedFormats: v.array(v.string()),
    layers: v.array(layerValidator),
    previewStorageId: v.optional(v.id("_storage")),
    isSystem: v.boolean(),
    locales: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    if (args.isSystem && currentUser.role !== "admin" && currentUser.role !== "owner") {
      throw new Error("Only admins can create system templates");
    }

    // Check slug uniqueness
    const existing = await ctx.db
      .query("templates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error(`Template with slug "${args.slug}" already exists`);

    return await ctx.db.insert("templates", {
      ...args,
      orgId: args.isSystem ? undefined : currentUser.orgId,
      parentTemplateId: undefined,
      parentVersion: undefined,
      version: 1,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    templateId: v.id("templates"),
    name: v.optional(v.string()),
    nameAr: v.optional(v.string()),
    category: v.optional(categoryValidator),
    supportedFormats: v.optional(v.array(v.string())),
    layers: v.optional(v.array(layerValidator)),
    previewStorageId: v.optional(v.id("_storage")),
    locales: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    const { templateId, ...updates } = args;
    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");

    if (template.isSystem) {
      if (currentUser.role !== "admin" && currentUser.role !== "owner") {
        throw new Error("Only admins can update system templates");
      }
    } else if (template.orgId !== currentUser.orgId) {
      throw new Error("Unauthorized");
    }

    const patch: Record<string, unknown> = {
      version: template.version + 1,
    };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(templateId, patch);
  },
});

export const fork = mutation({
  args: {
    templateId: v.id("templates"),
    name: v.string(),
    nameAr: v.string(),
    layerOverrides: v.optional(v.array(layerValidator)),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    const parent = await ctx.db.get(args.templateId);
    if (!parent) throw new Error("Template not found");

    const slug = `${parent.slug}-${currentUser.orgId}-${Date.now()}`;

    return await ctx.db.insert("templates", {
      slug,
      name: args.name,
      nameAr: args.nameAr,
      category: parent.category,
      supportedFormats: parent.supportedFormats,
      layers: args.layerOverrides ?? parent.layers,
      previewStorageId: parent.previewStorageId,
      isSystem: false,
      orgId: currentUser.orgId,
      parentTemplateId: args.templateId,
      parentVersion: parent.version,
      version: 1,
      locales: parent.locales,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    if (template.isSystem) throw new Error("Cannot delete system templates");
    if (template.orgId !== currentUser.orgId) throw new Error("Unauthorized");

    await ctx.db.delete(args.templateId);
  },
});

export const get = query({
  args: { templateId: v.id("templates") },
  handler: async (ctx, args) => {
    await requireCurrentUser(ctx);
    const template = await ctx.db.get(args.templateId);
    if (!template) return null;

    const previewUrl = template.previewStorageId
      ? await ctx.storage.getUrl(template.previewStorageId)
      : null;

    // Check if parent has a newer version
    let updateAvailable = false;
    if (template.parentTemplateId && template.parentVersion) {
      const parent = await ctx.db.get(template.parentTemplateId);
      if (parent && parent.version > template.parentVersion) {
        updateAvailable = true;
      }
    }

    return { ...template, previewUrl, updateAvailable };
  },
});

export const listSystem = query({
  args: {
    category: v.optional(categoryValidator),
  },
  handler: async (ctx, args) => {
    await requireCurrentUser(ctx);
    let q = ctx.db
      .query("templates")
      .withIndex("by_isSystem", (q) => q.eq("isSystem", true));

    const templates = await q.collect();

    const filtered = args.category
      ? templates.filter((t) => t.category === args.category)
      : templates;

    return Promise.all(
      filtered.map(async (template) => ({
        ...template,
        previewUrl: template.previewStorageId
          ? await ctx.storage.getUrl(template.previewStorageId)
          : null,
      }))
    );
  },
});

export const listByOrg = query({
  args: {
    category: v.optional(categoryValidator),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    const templates = await ctx.db
      .query("templates")
      .withIndex("by_orgId", (q) => q.eq("orgId", currentUser.orgId))
      .collect();

    const filtered = args.category
      ? templates.filter((t) => t.category === args.category)
      : templates;

    return Promise.all(
      filtered.map(async (template) => ({
        ...template,
        previewUrl: template.previewStorageId
          ? await ctx.storage.getUrl(template.previewStorageId)
          : null,
      }))
    );
  },
});
