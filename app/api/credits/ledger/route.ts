import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);

    const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);
    const offset = Number(searchParams.get("offset") || "0");

    const { data: ledger, error, count } = await admin
      .from("credit_ledger")
      .select("*", { count: "exact" })
      .eq("user_auth_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Failed to fetch credit ledger:", error);
      return NextResponse.json(
        { error: "Failed to fetch credit ledger" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entries: ledger ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("GET /api/credits/ledger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
