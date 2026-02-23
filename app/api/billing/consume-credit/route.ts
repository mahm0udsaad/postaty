import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

const CREDIT_THRESHOLDS = [
  {
    remaining: 0,
    key: "remaining_0",
    title: "نفد رصيدك",
    body: "لقد استخدمت جميع أرصدتك. اشترِ أرصدة إضافية أو انتظر تجديد الاشتراك.",
  },
  {
    remaining: 1,
    key: "remaining_1",
    title: "رصيد واحد متبقي!",
    body: "باقي لديك رصيد واحد فقط! اشترِ أرصدة إضافية لتتمكن من الاستمرار.",
  },
  {
    remaining: 3,
    key: "remaining_3",
    title: "رصيدك ينخفض",
    body: "باقي لديك 3 أرصدة فقط. فكّر بشراء أرصدة إضافية.",
  },
];

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();
    const { idempotencyKey } = await request.json();

    if (!idempotencyKey || typeof idempotencyKey !== "string") {
      return NextResponse.json(
        { error: "idempotencyKey is required" },
        { status: 400 }
      );
    }

    // Check if already consumed (idempotency)
    const { data: existingLedger } = await admin
      .from("credit_ledger")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .single();

    if (existingLedger) {
      return NextResponse.json({ ok: true, alreadyConsumed: true });
    }

    // Get billing record
    const { data: billing, error: billingError } = await admin
      .from("billing")
      .select("*")
      .eq("user_auth_id", user.id)
      .single();

    if (billingError || !billing) {
      return NextResponse.json(
        { error: "Billing record not found" },
        { status: 404 }
      );
    }

    // Check subscription status
    if (
      ["past_due", "canceled", "unpaid", "incomplete_expired"].includes(
        billing.status
      )
    ) {
      return NextResponse.json(
        { error: "Subscription is not active" },
        { status: 403 }
      );
    }

    const monthlyRemaining = Math.max(
      billing.monthly_credit_limit - billing.monthly_credits_used,
      0
    );
    const addonRemaining = billing.addon_credits_balance;

    if (monthlyRemaining + addonRemaining < 1) {
      return NextResponse.json(
        { error: "No credits remaining" },
        { status: 403 }
      );
    }

    // Determine which credits to consume (monthly first, then addon)
    let monthlyCreditsUsed = billing.monthly_credits_used;
    let addonCreditsBalance = billing.addon_credits_balance;
    let source: "monthly" | "addon" = "monthly";

    if (monthlyRemaining > 0) {
      monthlyCreditsUsed += 1;
      source = "monthly";
    } else {
      addonCreditsBalance -= 1;
      source = "addon";
    }

    const now = Date.now();

    // Update billing record
    const { error: updateError } = await admin
      .from("billing")
      .update({
        monthly_credits_used: monthlyCreditsUsed,
        addon_credits_balance: addonCreditsBalance,
        updated_at: now,
      })
      .eq("id", billing.id);

    if (updateError) {
      console.error("Failed to update billing:", updateError);
      return NextResponse.json(
        { error: "Failed to consume credit" },
        { status: 500 }
      );
    }

    // Insert ledger entry
    await admin.from("credit_ledger").insert({
      user_auth_id: user.id,
      billing_id: billing.id,
      amount: -1,
      reason: "usage",
      source,
      idempotency_key: idempotencyKey,
      monthly_credits_used_after: monthlyCreditsUsed,
      addon_credits_balance_after: addonCreditsBalance,
      created_at: now,
    });

    // Check low-credit thresholds and insert notification if needed
    const newMonthlyRemaining = Math.max(
      billing.monthly_credit_limit - monthlyCreditsUsed,
      0
    );
    const newTotalRemaining = newMonthlyRemaining + addonCreditsBalance;

    const matchedThreshold = CREDIT_THRESHOLDS.find(
      (t) => newTotalRemaining <= t.remaining
    );

    if (matchedThreshold) {
      const periodStart = billing.current_period_start ?? 0;

      // Check if this threshold notification was already sent this period
      const { data: existingNotifications } = await admin
        .from("notifications")
        .select("id, metadata")
        .eq("user_auth_id", user.id)
        .eq("type", "credit")
        .gte("created_at", periodStart);

      const alreadySent = (existingNotifications ?? []).some((n) => {
        if (!n.metadata) return false;
        try {
          const meta = JSON.parse(n.metadata);
          return meta.threshold === matchedThreshold.key;
        } catch {
          return false;
        }
      });

      if (!alreadySent) {
        await admin.from("notifications").insert({
          user_auth_id: user.id,
          title: matchedThreshold.title,
          body: matchedThreshold.body,
          type: "credit",
          is_read: false,
          metadata: JSON.stringify({
            threshold: matchedThreshold.key,
            totalRemaining: newTotalRemaining,
          }),
          created_at: now,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      alreadyConsumed: false,
      source,
      monthlyCreditsUsed,
      addonCreditsBalance,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/billing/consume-credit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
