import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./auth";

// ── Create a new poster generation job ──────────────────────────────

export const create = mutation({
  args: {
    category: v.union(
      v.literal("restaurant"),
      v.literal("supermarket"),
      v.literal("ecommerce"),
      v.literal("services"),
      v.literal("fashion"),
      v.literal("beauty"),
      v.literal("online") // legacy
    ),
    formDataJson: v.string(),
    format: v.string(),
    totalDesigns: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    const results = Array.from({ length: args.totalDesigns }, (_, i) => ({
      designIndex: i,
      format: args.format,
      status: "pending" as const,
    }));

    const jobId = await ctx.db.insert("poster_jobs", {
      orgId: currentUser.orgId,
      userId: currentUser._id,
      category: args.category,
      formDataJson: args.formDataJson,
      status: "pending",
      results,
      totalDesigns: args.totalDesigns,
      completedDesigns: 0,
      startedAt: Date.now(),
    });

    return jobId;
  },
});

// ── Update job status ───────────────────────────────────────────────

export const updateStatus = mutation({
  args: {
    jobId: v.id("poster_jobs"),
    status: v.union(
      v.literal("pending"),
      v.literal("generating-designs"),
      v.literal("rendering"),
      v.literal("complete"),
      v.literal("error")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, status, error }) => {
    const currentUser = await requireCurrentUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");
    if (job.orgId !== currentUser.orgId) throw new Error("Unauthorized");

    const updates: Record<string, unknown> = { status };
    if (error !== undefined) updates.error = error;
    if (status === "complete" || status === "error") {
      updates.completedAt = Date.now();
    }
    await ctx.db.patch(jobId, updates);
  },
});

// ── Save the 6 AI-generated designs to the job ─────────────────────

export const updateDesigns = mutation({
  args: {
    jobId: v.id("poster_jobs"),
    designsJson: v.string(),
  },
  handler: async (ctx, { jobId, designsJson }) => {
    const currentUser = await requireCurrentUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");
    if (job.orgId !== currentUser.orgId) throw new Error("Unauthorized");

    await ctx.db.patch(jobId, {
      designsJson,
      status: "rendering",
    });
  },
});

// ── Update a single result (called per completed poster) ────────────

export const updateResult = mutation({
  args: {
    jobId: v.id("poster_jobs"),
    designIndex: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("rendering"),
      v.literal("complete"),
      v.literal("error")
    ),
    storageId: v.optional(v.id("_storage")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireCurrentUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    if (job.orgId !== currentUser.orgId) throw new Error("Unauthorized");

    const results = job.results.map((r) =>
      r.designIndex === args.designIndex
        ? {
            ...r,
            status: args.status,
            ...(args.storageId !== undefined && { storageId: args.storageId }),
            ...(args.error !== undefined && { error: args.error }),
          }
        : r
    );

    const completedDesigns = results.filter(
      (r) => r.status === "complete" || r.status === "error"
    ).length;

    const allDone = completedDesigns === job.totalDesigns;

    await ctx.db.patch(args.jobId, {
      results,
      completedDesigns,
      ...(allDone && {
        status: "complete" as const,
        completedAt: Date.now(),
      }),
    });
  },
});

// ── Get a job with resolved storage URLs ────────────────────────────

export const get = query({
  args: { jobId: v.id("poster_jobs") },
  handler: async (ctx, { jobId }) => {
    const currentUser = await requireCurrentUser(ctx);
    const job = await ctx.db.get(jobId);
    if (!job) return null;
    if (job.orgId !== currentUser.orgId) throw new Error("Unauthorized");

    const results = await Promise.all(
      job.results.map(async (r) => ({
        ...r,
        storageUrl: r.storageId
          ? await ctx.storage.getUrl(r.storageId)
          : undefined,
      }))
    );

    return { ...job, results };
  },
});

// ── List recent jobs for an org ─────────────────────────────────────

export const listByOrg = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const currentUser = await requireCurrentUser(ctx);
    return await ctx.db
      .query("poster_jobs")
      .withIndex("by_orgId", (q) => q.eq("orgId", currentUser.orgId))
      .order("desc")
      .take(limit ?? 20);
  },
});
