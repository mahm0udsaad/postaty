import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

type ModelStats = {
  count: number;
  cost: number;
  images: number;
  totalDuration: number;
  avgDurationMs: number;
  providers: string[];
};

type ProviderStats = {
  count: number;
  cost: number;
  images: number;
  successCount: number;
  failureCount: number;
};

type GenerationSummary = {
  generationId: string;
  generationType: string;
  route: string;
  createdAt: number;
  providers: string[];
  models: string[];
  inputTokens: number;
  outputTokens: number;
  images: number;
  requestCount: number;
  totalCostUsd: number;
  success: boolean;
  fallbackUsed: boolean;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const periodDays = parseInt(searchParams.get("periodDays") || "30", 10);
    const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;

    const [{ data: aiEvents }, { data: firstExactRow }, { data: revenueEvents }, { count: totalUsers }, { data: allBilling }, { data: countryPrices }] =
      await Promise.all([
        admin
          .from("ai_usage_events")
          .select("generation_id, generation_type, route, model, provider, total_cost_usd, images_generated, duration_ms, success, input_tokens, output_tokens, created_at")
          .eq("cost_mode", "exact")
          .gte("created_at", cutoff),
        admin
          .from("ai_usage_events")
          .select("created_at")
          .eq("cost_mode", "exact")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        admin
          .from("stripe_revenue_events")
          .select("currency, amount_cents, actual_stripe_fee_cents, estimated_stripe_fee_cents")
          .gte("created_at", cutoff),
        admin.from("users").select("id", { count: "exact", head: true }),
        admin.from("billing").select("status, plan_key"),
        admin
          .from("country_pricing")
          .select("plan_key, monthly_amount_cents")
          .eq("country_code", "US")
          .eq("is_active", true),
      ]);

    const exactEvents = aiEvents ?? [];
    const byModel: Record<string, ModelStats> = {};
    const byProvider: Record<string, ProviderStats> = {};
    const generationMap = new Map<string, GenerationSummary>();

    for (const event of exactEvents) {
      const model = event.model ?? "unknown";
      const provider = event.provider ?? "unknown";
      const eventCost = toNumber(event.total_cost_usd);
      const eventImages = toNumber(event.images_generated);
      const eventDuration = toNumber(event.duration_ms);
      const eventInputTokens = toNumber(event.input_tokens);
      const eventOutputTokens = toNumber(event.output_tokens);

      if (!byModel[model]) {
        byModel[model] = {
          count: 0,
          cost: 0,
          images: 0,
          totalDuration: 0,
          avgDurationMs: 0,
          providers: [],
        };
      }
      byModel[model].count += 1;
      byModel[model].cost += eventCost;
      byModel[model].images += eventImages;
      byModel[model].totalDuration += eventDuration;
      if (!byModel[model].providers.includes(provider)) {
        byModel[model].providers.push(provider);
      }

      if (!byProvider[provider]) {
        byProvider[provider] = {
          count: 0,
          cost: 0,
          images: 0,
          successCount: 0,
          failureCount: 0,
        };
      }
      byProvider[provider].count += 1;
      byProvider[provider].cost += eventCost;
      byProvider[provider].images += eventImages;
      if (event.success) {
        byProvider[provider].successCount += 1;
      } else {
        byProvider[provider].failureCount += 1;
      }

      if (event.generation_id) {
        const summaryKey = `${event.generation_type ?? event.route}:${event.generation_id}`;
        const existing = generationMap.get(summaryKey) ?? {
          generationId: event.generation_id,
          generationType: event.generation_type ?? event.route ?? "unknown",
          route: event.route ?? "unknown",
          createdAt: toNumber(event.created_at),
          providers: [] as string[],
          models: [] as string[],
          inputTokens: 0,
          outputTokens: 0,
          images: 0,
          requestCount: 0,
          totalCostUsd: 0,
          success: true,
          fallbackUsed: false,
        };

        if (!existing.providers.includes(provider)) existing.providers.push(provider);
        if (!existing.models.includes(model)) existing.models.push(model);
        existing.inputTokens += eventInputTokens;
        existing.outputTokens += eventOutputTokens;
        existing.images += eventImages;
        existing.requestCount += 1;
        existing.totalCostUsd += eventCost;
        existing.success = existing.success && Boolean(event.success);
        existing.createdAt = Math.max(existing.createdAt, toNumber(event.created_at));
        existing.fallbackUsed =
          existing.providers.length > 1 || existing.models.length > 1;

        generationMap.set(summaryKey, existing);
      }
    }

    for (const key of Object.keys(byModel)) {
      byModel[key].avgDurationMs =
        byModel[key].count > 0
          ? byModel[key].totalDuration / byModel[key].count
          : 0;
    }

    const generationSummaries = Array.from(generationMap.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);
    const fallbackCount = generationSummaries.filter(
      (summary) => summary.fallbackUsed
    ).length;

    const totalRequests = exactEvents.length;
    const successCount = exactEvents.filter((event) => event.success).length;
    const failureCount = totalRequests - successCount;
    const exactApiCostUsd = exactEvents.reduce(
      (sum, event) => sum + toNumber(event.total_cost_usd),
      0
    );
    const totalImages = exactEvents.reduce(
      (sum, event) => sum + toNumber(event.images_generated),
      0
    );
    const successfulGenerationSummaries = generationSummaries.filter(
      (summary) => summary.success
    );
    const avgCostPerSuccessfulDesign =
      successfulGenerationSummaries.length > 0
        ? successfulGenerationSummaries.reduce(
            (sum, summary) => sum + summary.totalCostUsd,
            0
          ) / successfulGenerationSummaries.length
        : 0;

    const usdRevenue = (revenueEvents || []).filter((event) => event.currency === "USD");
    const grossRevenue =
      usdRevenue.reduce((sum, event) => sum + event.amount_cents, 0) / 100;
    const stripeFees =
      usdRevenue.reduce(
        (sum, event) =>
          sum + (event.actual_stripe_fee_cents ?? event.estimated_stripe_fee_cents),
        0
      ) / 100;
    const hasActualFees = usdRevenue.some(
      (event) => event.actual_stripe_fee_cents != null
    );
    const exactNetProfit = grossRevenue - stripeFees - exactApiCostUsd;

    const activeSubs = (allBilling || []).filter(
      (billing) => billing.status === "active" || billing.status === "trialing"
    );
    const planPricing: Record<string, number> = { none: 0 };
    for (const price of countryPrices || []) {
      planPricing[price.plan_key] = price.monthly_amount_cents / 100;
    }
    const mrr = activeSubs.reduce(
      (sum, billing) => sum + (planPricing[billing.plan_key] ?? 0),
      0
    );

    const res = NextResponse.json({
      ai: {
        periodDays,
        totalRequests,
        successCount,
        failureCount,
        successRate: totalRequests > 0 ? successCount / totalRequests : 0,
        exactApiCostUsd,
        exactCostCoverageStart: firstExactRow?.created_at ?? null,
        totalImages,
        byProvider,
        byModel,
        avgCostPerSuccessfulDesign,
        fallbackCount,
        generationSummaries,
      },
      financial: {
        periodDays,
        grossRevenue,
        stripeFees,
        hasActualFees,
        exactApiCostUsd,
        exactNetProfit,
        exactCostCoverageStart: firstExactRow?.created_at ?? null,
        totalUsers: totalUsers ?? 0,
        activeSubscriptions: activeSubs.length,
        subscriptionsByPlan: {
          starter: activeSubs.filter((billing) => billing.plan_key === "starter").length,
          growth: activeSubs.filter((billing) => billing.plan_key === "growth").length,
          dominant: activeSubs.filter((billing) => billing.plan_key === "dominant").length,
        },
        mrr,
      },
    });

    res.headers.set(
      "Cache-Control",
      "private, max-age=30, stale-while-revalidate=60"
    );
    return res;
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    console.error("[admin/overview] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
