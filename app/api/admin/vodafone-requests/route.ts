import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

const PLAN_CREDITS: Record<string, number> = {
  starter: 150,
  growth: 350,
  dominant: 700,
};

const ADDON_CREDITS: Record<string, number> = {
  addon_5: 50,
  addon_10: 100,
};

export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: requests, error } = await admin
      .from("vodafone_payment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/vodafone-requests] GET error:", error);
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    const pending = (requests || []).filter((r) => r.status === "pending").length;
    const approved = (requests || []).filter((r) => r.status === "approved").length;
    const rejected = (requests || []).filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      requests: requests || [],
      summary: { pending, approved, rejected, total: (requests || []).length },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/vodafone-requests] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const body = await request.json();
    const { requestId, action, planKey, addonKey, adminNotes } = body as {
      requestId: string;
      action: "approve" | "reject";
      planKey?: string;
      addonKey?: string;
      adminNotes?: string;
    };

    if (!requestId || !action) {
      return NextResponse.json({ error: "requestId and action required" }, { status: 400 });
    }

    // Get the request
    const { data: paymentReq, error: fetchErr } = await admin
      .from("vodafone_payment_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchErr || !paymentReq) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (paymentReq.status !== "pending") {
      return NextResponse.json({ error: "Request already processed" }, { status: 409 });
    }

    const now = Date.now();

    if (action === "reject") {
      await admin
        .from("vodafone_payment_requests")
        .update({
          status: "rejected",
          admin_notes: adminNotes || null,
          updated_at: now,
        })
        .eq("id", requestId);

      // Notify user
      await admin.from("notifications").insert({
        user_auth_id: paymentReq.user_auth_id,
        type: "warning",
        title: "تم رفض طلب الدفع | Payment request rejected",
        body: adminNotes
          ? `سبب الرفض: ${adminNotes} | Reason: ${adminNotes}`
          : "تم رفض طلب الدفع عبر فودافون كاش. تواصل معنا للمزيد. | Your Vodafone Cash payment request was rejected. Contact us for details.",
        is_read: false,
        metadata: JSON.stringify({ type: "vodafone_cash_rejected", requestId }),
        created_at: now,
      });

      return NextResponse.json({ ok: true });
    }

    // ---- APPROVE ----
    if (!planKey && !addonKey) {
      return NextResponse.json(
        { error: "Must specify planKey or addonKey when approving" },
        { status: 400 }
      );
    }

    const userAuthId = paymentReq.user_auth_id;

    if (planKey) {
      // Grant subscription for 1 month
      const credits = PLAN_CREDITS[planKey];
      if (!credits) {
        return NextResponse.json({ error: "Invalid plan key" }, { status: 400 });
      }

      const periodStart = now;
      const periodEnd = now + 30 * 24 * 60 * 60 * 1000; // 30 days

      // Upsert billing record
      const { data: existingBilling } = await admin
        .from("billing")
        .select("id")
        .eq("user_auth_id", userAuthId)
        .single();

      if (existingBilling) {
        await admin
          .from("billing")
          .update({
            plan_key: planKey,
            status: "active",
            payment_method: "vodafone_cash",
            monthly_credit_limit: credits,
            monthly_credits_used: 0,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: now,
          })
          .eq("id", existingBilling.id);
      } else {
        await admin.from("billing").insert({
          user_auth_id: userAuthId,
          plan_key: planKey,
          status: "active",
          payment_method: "vodafone_cash",
          monthly_credit_limit: credits,
          monthly_credits_used: 0,
          addon_credits_balance: 0,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          created_at: now,
          updated_at: now,
        });
      }

      // Update payment request
      await admin
        .from("vodafone_payment_requests")
        .update({
          status: "approved",
          plan_key: planKey,
          admin_notes: adminNotes || null,
          subscription_start: periodStart,
          subscription_end: periodEnd,
          updated_at: now,
        })
        .eq("id", requestId);

      // Log to credit ledger
      await admin.from("credit_ledger").insert({
        user_auth_id: userAuthId,
        billing_id: existingBilling?.id,
        amount: credits,
        reason: "monthly_allowance",
        source: "manual",
        monthly_credits_used_after: 0,
        addon_credits_balance_after: 0,
        created_at: now,
      });
    }

    if (addonKey) {
      // Grant addon credits
      const credits = ADDON_CREDITS[addonKey];
      if (!credits) {
        return NextResponse.json({ error: "Invalid addon key" }, { status: 400 });
      }

      const { data: existingBilling } = await admin
        .from("billing")
        .select("id, addon_credits_balance")
        .eq("user_auth_id", userAuthId)
        .single();

      const newBalance = (existingBilling?.addon_credits_balance || 0) + credits;

      if (existingBilling) {
        await admin
          .from("billing")
          .update({
            addon_credits_balance: newBalance,
            updated_at: now,
          })
          .eq("id", existingBilling.id);
      } else {
        await admin.from("billing").insert({
          user_auth_id: userAuthId,
          plan_key: "none",
          status: "none",
          addon_credits_balance: credits,
          monthly_credit_limit: 0,
          monthly_credits_used: 0,
          created_at: now,
          updated_at: now,
        });
      }

      // Update payment request
      await admin
        .from("vodafone_payment_requests")
        .update({
          status: "approved",
          addon_key: addonKey,
          admin_notes: adminNotes || null,
          updated_at: now,
        })
        .eq("id", requestId);

      // Log to credit ledger
      await admin.from("credit_ledger").insert({
        user_auth_id: userAuthId,
        billing_id: existingBilling?.id,
        amount: credits,
        reason: "purchase",
        source: "manual",
        monthly_credits_used_after: 0,
        addon_credits_balance_after: newBalance,
        created_at: now,
      });
    }

    // Notify user
    await admin.from("notifications").insert({
      user_auth_id: userAuthId,
      type: "info",
      title: "تم تفعيل اشتراكك | Subscription activated",
      body: planKey
        ? `تم تفعيل خطة ${planKey} لمدة شهر عبر فودافون كاش. | Your ${planKey} plan has been activated for 1 month via Vodafone Cash.`
        : `تم إضافة ${ADDON_CREDITS[addonKey!]} رصيد إضافي. | ${ADDON_CREDITS[addonKey!]} addon credits have been added.`,
      is_read: false,
      metadata: JSON.stringify({
        type: "vodafone_cash_approved",
        requestId,
        planKey,
        addonKey,
      }),
      created_at: now,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/vodafone-requests] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
