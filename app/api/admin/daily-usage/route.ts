import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const periodDays = parseInt(searchParams.get("periodDays") || "30");
    const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;

    const { data: events, error } = await admin
      .from("ai_usage_events")
      .select("*")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[admin/daily-usage] Failed to fetch events:", error);
      return NextResponse.json(
        { error: "Failed to fetch usage events" },
        { status: 500 }
      );
    }

    // Group by day
    const dailyMap: Record<
      string,
      {
        date: string;
        requests: number;
        cost: number;
        images: number;
        failures: number;
      }
    > = {};

    for (const e of events || []) {
      const date = new Date(e.created_at).toISOString().split("T")[0];
      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          requests: 0,
          cost: 0,
          images: 0,
          failures: 0,
        };
      }
      dailyMap[date].requests++;
      dailyMap[date].cost += Number(e.estimated_cost_usd);
      dailyMap[date].images += Number(e.images_generated);
      if (!e.success) {
        dailyMap[date].failures++;
      }
    }

    // Sort by date ascending
    const dailyUsage = Object.values(dailyMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({ dailyUsage, periodDays });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    console.error("[admin/daily-usage] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
