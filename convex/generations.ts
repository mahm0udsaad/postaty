import { mutation, query, internalMutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

const categoryValidator = v.union(
  v.literal("restaurant"),
  v.literal("supermarket"),
  v.literal("online")
);

const statusValidator = v.union(
  v.literal("queued"),
  v.literal("processing"),
  v.literal("complete"),
  v.literal("partial"),
  v.literal("failed")
);

export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    brandKitId: v.optional(v.id("brand_kits")),
    templateId: v.optional(v.id("templates")),
    category: categoryValidator,
    businessName: v.string(),
    productName: v.string(),
    inputs: v.string(),
    formats: v.array(v.string()),
    creditsCharged: v.number(),
  },
  handler: async (ctx, args) => {
    const outputs = args.formats.map((format) => ({
      format,
      storageId: undefined,
      width: 0,
      height: 0,
    }));

    return await ctx.db.insert("generations", {
      orgId: args.orgId,
      userId: args.userId,
      brandKitId: args.brandKitId,
      templateId: args.templateId,
      category: args.category,
      businessName: args.businessName,
      productName: args.productName,
      inputs: args.inputs,
      promptUsed: "",
      outputs,
      status: "queued",
      creditsCharged: args.creditsCharged,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    generationId: v.id("generations"),
    status: statusValidator,
    error: v.optional(v.string()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      status: args.status,
      ...(args.error !== undefined && { error: args.error }),
      ...(args.durationMs !== undefined && { durationMs: args.durationMs }),
    });
  },
});

export const updatePrompt = mutation({
  args: {
    generationId: v.id("generations"),
    promptUsed: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      promptUsed: args.promptUsed,
    });
  },
});

export const updateOutput = mutation({
  args: {
    generationId: v.id("generations"),
    format: v.string(),
    storageId: v.id("_storage"),
    width: v.number(),
    height: v.number(),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.generationId);
    if (!generation) throw new Error("Generation not found");

    const outputs = generation.outputs.map((output) =>
      output.format === args.format
        ? {
            ...output,
            storageId: args.storageId,
            width: args.width,
            height: args.height,
          }
        : output
    );

    await ctx.db.patch(args.generationId, { outputs });
  },
});

export const get = query({
  args: { generationId: v.id("generations") },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.generationId);
    if (!generation) return null;

    const outputs = await Promise.all(
      generation.outputs.map(async (output) => ({
        ...output,
        url: output.storageId
          ? await ctx.storage.getUrl(output.storageId)
          : null,
      }))
    );

    return { ...generation, outputs };
  },
});

export const listByOrg = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const generations = await ctx.db
      .query("generations")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(limit);

    return Promise.all(
      generations.map(async (gen) => ({
        ...gen,
        outputs: await Promise.all(
          gen.outputs.map(async (output) => ({
            ...output,
            url: output.storageId
              ? await ctx.storage.getUrl(output.storageId)
              : null,
          }))
        ),
      }))
    );
  },
});

// Paginated query for infinite scroll
export const listByOrgPaginated = query({
  args: {
    orgId: v.id("organizations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("generations")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      results.page.map(async (gen) => ({
        ...gen,
        outputs: await Promise.all(
          gen.outputs.map(async (output) => ({
            ...output,
            url: output.storageId
              ? await ctx.storage.getUrl(output.storageId)
              : null,
          }))
        ),
      }))
    );

    return {
      ...results,
      page,
    };
  },
});

export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("generations")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

export const countActiveByOrg = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    const active = await ctx.db
      .query("generations")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "queued"),
          q.eq(q.field("status"), "processing")
        )
      )
      .collect();
    return active.length;
  },
});

export const storeGeneratedImage = internalMutation({
  args: {
    generationId: v.id("generations"),
    format: v.string(),
    storageId: v.id("_storage"),
    width: v.number(),
    height: v.number(),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.generationId);
    if (!generation) throw new Error("Generation not found");

    const outputs = generation.outputs.map((output) =>
      output.format === args.format
        ? {
            ...output,
            storageId: args.storageId,
            width: args.width,
            height: args.height,
          }
        : output
    );

    await ctx.db.patch(args.generationId, { outputs });
  },
});

export const list = query({
  args: {
    category: v.optional(categoryValidator),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("generations")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .take(20);
    }
    return await ctx.db.query("generations").order("desc").take(20);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
