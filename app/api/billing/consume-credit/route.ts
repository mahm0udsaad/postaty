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

function consumeCreditLog(step: string, details?: Record<string, unknown>): void {
  if (details) {
    console.info(`[consume-credit] ${step}`, details);
    return;
  }
  console.info(`[consume-credit] ${step}`);
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = `cc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    consumeCreditLog("request_started", { requestId });
    consumeCreditLog("auth_started", { requestId });
    const user = await requireAuth();
    consumeCreditLog("auth_done", { requestId, userId: user.id });
    const admin = createAdminClient();

    let body: unknown;
    try {
      consumeCreditLog("parse_body_started", { requestId });
      body = await request.json();
      consumeCreditLog("parse_body_done", { requestId });
    } catch {
      consumeCreditLog("parse_body_failed", { requestId });
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      consumeCreditLog("invalid_body_shape", { requestId });
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsedBody = body as { idempotencyKey?: unknown; amount?: unknown };
    const idempotencyKey = parsedBody.idempotencyKey;
    const rawAmount = parsedBody.amount;

    if (!idempotencyKey || typeof idempotencyKey !== "string") {
      consumeCreditLog("missing_idempotency_key", { requestId });
      return NextResponse.json(
        { error: "idempotencyKey is required" },
        { status: 400 }
      );
    }

    // Amount defaults to 1, supports consuming multiple credits at once
    const amount = typeof rawAmount === "number" && Number.isInteger(rawAmount) && rawAmount >= 1 && rawAmount <= 10
      ? rawAmount
      : 1;
    consumeCreditLog("validated_input", { requestId, amount, idempotencyKey });

    // Check if already consumed (idempotency)
    consumeCreditLog("idempotency_check_started", { requestId });
    const { data: existingLedger, error: idempotencyError } = await admin
      .from("credit_ledger")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    consumeCreditLog("idempotency_check_done", {
      requestId,
      alreadyConsumed: Boolean(existingLedger),
      hasError: Boolean(idempotencyError),
    });

    if (existingLedger) {
      consumeCreditLog("request_completed", {
        requestId,
        alreadyConsumed: true,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ ok: true, alreadyConsumed: true });
    }

    // Get billing record
    consumeCreditLog("billing_fetch_started", { requestId });
    const { data: billing, error: billingError } = await admin
      .from("billing")
      .select("*")
      .eq("user_auth_id", user.id)
      .single();
    consumeCreditLog("billing_fetch_done", {
      requestId,
      hasBilling: Boolean(billing),
      hasError: Boolean(billingError),
    });

    if (billingError || !billing) {
      consumeCreditLog("billing_not_found", { requestId });
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
      consumeCreditLog("subscription_ineligible", {
        requestId,
        status: billing.status,
      });
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

    if (monthlyRemaining + addonRemaining < amount) {
      consumeCreditLog("insufficient_credits", {
        requestId,
        monthlyRemaining,
        addonRemaining,
        amount,
      });
      return NextResponse.json(
        { error: "No credits remaining" },
        { status: 403 }
      );
    }

    // Determine which credits to consume (monthly first, then addon)
    let monthlyCreditsUsed = billing.monthly_credits_used;
    let addonCreditsBalance = billing.addon_credits_balance;
    let source: "monthly" | "addon" = "monthly";

    let remaining = amount;

    // Consume from monthly first
    const fromMonthly = Math.min(remaining, monthlyRemaining);
    if (fromMonthly > 0) {
      monthlyCreditsUsed += fromMonthly;
      remaining -= fromMonthly;
      source = "monthly";
    }

    // Overflow to addon credits
    if (remaining > 0) {
      addonCreditsBalance -= remaining;
      source = remaining === amount ? "addon" : "monthly"; // primary source
    }

    const now = Date.now();

    // Update billing record
    consumeCreditLog("billing_update_started", {
      requestId,
      monthlyCreditsUsed,
      addonCreditsBalance,
    });
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
      consumeCreditLog("billing_update_failed", { requestId });
      return NextResponse.json(
        { error: "Failed to consume credit" },
        { status: 500 }
      );
    }
    consumeCreditLog("billing_update_done", { requestId });

    // Insert ledger entry
    consumeCreditLog("ledger_insert_started", { requestId });
    await admin.from("credit_ledger").insert({
      user_auth_id: user.id,
      billing_id: billing.id,
      amount: -amount,
      reason: "usage",
      source,
      idempotency_key: idempotencyKey,
      monthly_credits_used_after: monthlyCreditsUsed,
      addon_credits_balance_after: addonCreditsBalance,
      created_at: now,
    });
    consumeCreditLog("ledger_insert_done", { requestId });

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
      consumeCreditLog("threshold_matched", {
        requestId,
        threshold: matchedThreshold.key,
        newTotalRemaining,
      });
      const periodStart = billing.current_period_start ?? 0;

      // Check if this threshold notification was already sent this period
      consumeCreditLog("notification_lookup_started", { requestId });
      const { data: existingNotifications } = await admin
        .from("notifications")
        .select("id, metadata")
        .eq("user_auth_id", user.id)
        .eq("type", "credit")
        .gte("created_at", periodStart);
      consumeCreditLog("notification_lookup_done", {
        requestId,
        existingNotifications: existingNotifications?.length ?? 0,
      });

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
        consumeCreditLog("notification_insert_started", { requestId });
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
        consumeCreditLog("notification_insert_done", { requestId });
      }
    }

    consumeCreditLog("request_completed", {
      requestId,
      alreadyConsumed: false,
      source,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({
      ok: true,
      alreadyConsumed: false,
      source,
      monthlyCreditsUsed,
      addonCreditsBalance,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      consumeCreditLog("request_failed_unauthenticated", { requestId });
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/billing/consume-credit error:", error);
    consumeCreditLog("request_failed", {
      requestId,
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
