import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();

    const { data: events, error } = await admin
      .from("ai_usage_events")
      .select("*")
      .eq("user_auth_id", user.id);

    if (error) {
      console.error("Failed to fetch AI usage events:", error);
      return NextResponse.json(
        { error: "Failed to fetch usage data" },
        { status: 500 }
      );
    }

    const allEvents = events || [];
    let totalCost = 0;
    let totalImages = 0;
    let successCount = 0;
    let failureCount = 0;

    for (const e of allEvents) {
      totalCost += e.estimated_cost_usd || 0;
      totalImages += e.images_generated || 0;
      if (e.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return NextResponse.json({
      totalCost,
      totalImages,
      totalRequests: allEvents.length,
      successCount,
      failureCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("GET /api/ai-usage error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();
    const body = await request.json();

    // Support both single event and batch
    const events = body.events || [body];
    const now = Date.now();

    // Load pricing for all distinct models in one pass
    const models = [...new Set(events.map((e: Record<string, unknown>) => e.model))] as string[];
    const pricingMap = new Map<string, Record<string, number>>();

    for (const model of models) {
      const { data: pricing } = await admin
        .from("ai_pricing_config")
        .select("*")
        .eq("model", model)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (pricing) {
        pricingMap.set(model, pricing);
      }
    }

    const insertRows = events.map((e: Record<string, unknown>) => {
      const pricing = pricingMap.get(e.model as string);
      let estimatedCostUsd = 0;

      if (pricing) {
        const inputTokens = (e.inputTokens as number) || 0;
        const outputTokens = (e.outputTokens as number) || 0;
        const imagesGenerated = (e.imagesGenerated as number) || 0;

        const inputCost = (inputTokens / 1000) * (pricing.input_token_cost_per_1k || 0);
        const outputCost = (outputTokens / 1000) * (pricing.output_token_cost_per_1k || 0);
        const imageCost = imagesGenerated * (pricing.image_generation_cost || 0);
        estimatedCostUsd = inputCost + outputCost + imageCost;
      }

      return {
        user_auth_id: user.id,
        model: e.model,
        route: e.route || null,
        input_tokens: (e.inputTokens as number) || 0,
        output_tokens: (e.outputTokens as number) || 0,
        images_generated: (e.imagesGenerated as number) || 0,
        duration_ms: (e.durationMs as number) || 0,
        success: e.success ?? true,
        error: (e.error as string) || null,
        estimated_cost_usd: estimatedCostUsd,
        created_at: now,
      };
    });

    const { error } = await admin
      .from("ai_usage_events")
      .insert(insertRows);

    if (error) {
      console.error("Failed to insert AI usage events:", error);
      return NextResponse.json(
        { error: "Failed to record usage" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: insertRows.length }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/ai-usage error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
