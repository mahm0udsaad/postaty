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
    const { idempotencyKey, amount: rawAmount } = await request.json();

    if (!idempotencyKey || typeof idempotencyKey !== "string") {
      return NextResponse.json(
        { error: "idempotencyKey is required" },
        { status: 400 }
      );
    }

    // Amount defaults to 1 and supports larger/fractional values (e.g. 5 for edits, 20 for menus)
    const amount = typeof rawAmount === "number" && Number.isFinite(rawAmount) && rawAmount > 0
      ? rawAmount
      : 1;

    // Atomic credit consumption via Postgres function (uses FOR UPDATE row locking)
    const { data: result, error: rpcError } = await admin.rpc("consume_credits", {
      p_user_auth_id: user.id,
      p_idempotency_key: idempotencyKey,
      p_amount: amount,
    });

    if (rpcError) {
      console.error("consume_credits RPC error:", rpcError);
      return NextResponse.json(
        { error: "Failed to consume credit" },
        { status: 500 }
      );
    }

    // Handle RPC result
    if (!result.ok) {
      const statusCode = result.error_code ?? 500;
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    if (result.already_consumed) {
      return NextResponse.json({ ok: true, alreadyConsumed: true });
    }

    // Non-critical: check low-credit thresholds and send notification
    const monthlyCreditsUsed = result.monthly_credits_used;
    const addonCreditsBalance = result.addon_credits_balance;
    const monthlyLimit = result.monthly_credit_limit;
    const newMonthlyRemaining = Math.max(monthlyLimit - monthlyCreditsUsed, 0);
    const newTotalRemaining = newMonthlyRemaining + addonCreditsBalance;

    const matchedThreshold = CREDIT_THRESHOLDS.find(
      (t) => newTotalRemaining <= t.remaining
    );

    if (matchedThreshold) {
      const periodStart = result.current_period_start ?? 0;

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
        const now = Date.now();
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
      source: result.source,
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
