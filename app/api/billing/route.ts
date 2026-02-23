import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

export async function GET() {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();

    const { data: billing, error } = await admin
      .from("billing")
      .select("*")
      .eq("user_auth_id", user.id)
      .single();

    if (error || !billing) {
      return NextResponse.json({
        billing: null,
        planKey: "none",
        status: "none",
        monthlyCreditLimit: 0,
        monthlyCreditsUsed: 0,
        currentPeriodStart: null,
        currentPeriodEnd: null,
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
      billing,
      planKey: billing.plan_key,
      status: billing.status,
      monthlyCreditLimit: billing.monthly_credit_limit,
      monthlyCreditsUsed: billing.monthly_credits_used,
      currentPeriodStart: billing.current_period_start,
      currentPeriodEnd: billing.current_period_end,
      addonCreditsBalance: billing.addon_credits_balance,
      monthlyRemaining,
      addonRemaining,
      totalRemaining,
      canGenerate,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("GET /api/billing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
