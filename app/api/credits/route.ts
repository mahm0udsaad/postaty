import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth, requireAdmin } from "@/lib/supabase/auth-helpers";

export async function GET() {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();

    const { data: billing, error } = await admin
      .from("billing")
      .select(
        "id, plan_key, status, monthly_credit_limit, monthly_credits_used, addon_credits_balance, current_period_start, current_period_end"
      )
      .eq("user_auth_id", user.id)
      .single();

    if (error || !billing) {
      return NextResponse.json({
        planKey: "none",
        monthlyCreditLimit: 0,
        monthlyCreditsUsed: 0,
        addonCreditsBalance: 0,
        monthlyRemaining: 0,
        addonRemaining: 0,
        totalRemaining: 0,
        canGenerate: false,
      });
    }

    const monthlyRemaining = Math.max(
      billing.monthly_credit_limit - billing.monthly_credits_used,
      0
    );
    const addonRemaining = billing.addon_credits_balance;
    const totalRemaining = monthlyRemaining + addonRemaining;

    const hasEligibleStatus = ![
      "past_due",
      "canceled",
      "unpaid",
      "incomplete_expired",
    ].includes(billing.status);

    const canGenerate = hasEligibleStatus && totalRemaining > 0;

    return NextResponse.json({
      planKey: billing.plan_key,
      monthlyCreditLimit: billing.monthly_credit_limit,
      monthlyCreditsUsed: billing.monthly_credits_used,
      addonCreditsBalance: billing.addon_credits_balance,
      monthlyRemaining,
      addonRemaining,
      totalRemaining,
      canGenerate,
      currentPeriodStart: billing.current_period_start,
      currentPeriodEnd: billing.current_period_end,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("GET /api/credits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Require admin role for credit/debit operations
    const dbUser = await requireAdmin();
    const admin = createAdminClient();
    const body = await request.json();
    const { userAuthId, amount, reason, source } = body as {
      userAuthId: string;
      amount: number;
      reason: string;
      source?: string;
    };

    if (!userAuthId || typeof amount !== "number") {
      return NextResponse.json(
        { error: "userAuthId and amount are required" },
        { status: 400 }
      );
    }

    if (!["manual_adjustment", "addon_purchase", "monthly_reset"].includes(reason)) {
      return NextResponse.json(
        {
          error:
            "reason must be one of: manual_adjustment, addon_purchase, monthly_reset",
        },
        { status: 400 }
      );
    }

    // Get billing record for target user
    const { data: billing, error: billingError } = await admin
      .from("billing")
      .select("*")
      .eq("user_auth_id", userAuthId)
      .single();

    if (billingError || !billing) {
      return NextResponse.json(
        { error: "Billing record not found for target user" },
        { status: 404 }
      );
    }

    const now = Date.now();
    const creditSource = source || "addon";

    // For positive amounts, add to addon balance. For negative, subtract.
    const newAddonBalance = Math.max(
      billing.addon_credits_balance + amount,
      0
    );

    await admin
      .from("billing")
      .update({
        addon_credits_balance: newAddonBalance,
        updated_at: now,
      })
      .eq("id", billing.id);

    await admin.from("credit_ledger").insert({
      user_auth_id: userAuthId,
      billing_id: billing.id,
      amount,
      reason,
      source: creditSource,
      idempotency_key: `admin_${dbUser.id}_${now}`,
      monthly_credits_used_after: billing.monthly_credits_used,
      addon_credits_balance_after: newAddonBalance,
      created_at: now,
    });

    return NextResponse.json({
      ok: true,
      newAddonBalance,
      adjustedBy: amount,
      adjustedByAdmin: dbUser.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (
      error instanceof Error &&
      error.message === "Admin access required"
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    console.error("POST /api/credits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
