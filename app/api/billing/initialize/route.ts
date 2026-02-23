import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

const FREE_TIER_CREDITS = 10;

export async function POST() {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();

    // Check if billing already exists (idempotent)
    const { data: existing } = await admin
      .from("billing")
      .select("id")
      .eq("user_auth_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ id: existing.id, alreadyExisted: true });
    }

    const now = Date.now();

    // Insert billing record
    const { data: billing, error: billingError } = await admin
      .from("billing")
      .insert({
        user_auth_id: user.id,
        plan_key: "none",
        status: "none",
        monthly_credit_limit: 0,
        monthly_credits_used: 0,
        addon_credits_balance: FREE_TIER_CREDITS,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (billingError || !billing) {
      console.error("Failed to create billing:", billingError);
      return NextResponse.json(
        { error: "Failed to initialize billing" },
        { status: 500 }
      );
    }

    // Insert credit ledger entry with idempotency key
    const idempotencyKey = `free_tier_${user.id}`;

    // Check if ledger entry already exists (double-safety)
    const { data: existingLedger } = await admin
      .from("credit_ledger")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .single();

    if (!existingLedger) {
      await admin.from("credit_ledger").insert({
        user_auth_id: user.id,
        billing_id: billing.id,
        amount: FREE_TIER_CREDITS,
        reason: "manual_adjustment",
        source: "addon",
        idempotency_key: idempotencyKey,
        monthly_credits_used_after: 0,
        addon_credits_balance_after: FREE_TIER_CREDITS,
        created_at: now,
      });
    }

    return NextResponse.json({ id: billing.id, alreadyExisted: false });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/billing/initialize error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
