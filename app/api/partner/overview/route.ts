import { NextResponse } from "next/server";
import { requirePartnerAccess } from "@/lib/supabase/partner-auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { partner } = await requirePartnerAccess();
    const admin = createAdminClient();

    // Get all referrals for this partner
    const { data: referrals } = await admin
      .from("referrals")
      .select("referred_user_auth_id, created_at")
      .eq("partner_id", partner.id);

    const referralList = referrals || [];
    const totalReferred = referralList.length;

    if (totalReferred === 0) {
      return NextResponse.json({
        referralCode: partner.referral_code,
        totalReferred: 0,
        freeUsers: 0,
        subscribedUsers: 0,
        conversionRate: 0,
        planBreakdown: {},
        recentReferrals: [],
      });
    }

    const authIds = referralList.map((r) => r.referred_user_auth_id);

    // Fetch users
    const { data: users } = await admin
      .from("users")
      .select("auth_id, email, name, detected_country, created_at")
      .in("auth_id", authIds);

    // Fetch billing
    const { data: billingRecords } = await admin
      .from("billing")
      .select("user_auth_id, plan_key, status")
      .in("user_auth_id", authIds);

    const billingMap: Record<string, { plan_key: string; status: string }> = {};
    for (const b of billingRecords || []) {
      billingMap[b.user_auth_id] = { plan_key: b.plan_key, status: b.status };
    }

    // Compute stats
    let freeUsers = 0;
    let subscribedUsers = 0;
    const planBreakdown: Record<string, number> = {};

    for (const authId of authIds) {
      const billing = billingMap[authId];
      if (
        billing &&
        billing.plan_key !== "none" &&
        (billing.status === "active" || billing.status === "trialing")
      ) {
        subscribedUsers++;
        planBreakdown[billing.plan_key] =
          (planBreakdown[billing.plan_key] || 0) + 1;
      } else {
        freeUsers++;
      }
    }

    const conversionRate =
      totalReferred > 0
        ? Math.round((subscribedUsers / totalReferred) * 100)
        : 0;

    // Recent referrals (last 10)
    const userMap: Record<string, { email: string; name: string; created_at: number }> = {};
    for (const u of users || []) {
      userMap[u.auth_id] = { email: u.email, name: u.name, created_at: u.created_at };
    }

    const recentReferrals = referralList
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 10)
      .map((r) => {
        const u = userMap[r.referred_user_auth_id];
        const billing = billingMap[r.referred_user_auth_id];
        return {
          auth_id: r.referred_user_auth_id,
          name: u?.name || "Unknown",
          email: u?.email || "Unknown",
          plan_key: billing?.plan_key || "none",
          billing_status: billing?.status || "none",
          referred_at: r.created_at,
        };
      });

    return NextResponse.json({
      referralCode: partner.referral_code,
      totalReferred,
      freeUsers,
      subscribedUsers,
      conversionRate,
      planBreakdown,
      recentReferrals,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Partner access required") {
      return NextResponse.json({ error: "Partner access required" }, { status: 403 });
    }
    console.error("[partner/overview] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
