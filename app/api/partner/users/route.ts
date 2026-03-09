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
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false });

    const referralList = referrals || [];

    if (referralList.length === 0) {
      return NextResponse.json({ users: [], total: 0 });
    }

    const authIds = referralList.map((r) => r.referred_user_auth_id);

    // Fetch users
    const { data: users } = await admin
      .from("users")
      .select("auth_id, email, name, detected_country, status, created_at")
      .in("auth_id", authIds);

    // Fetch billing
    const { data: billingRecords } = await admin
      .from("billing")
      .select("user_auth_id, plan_key, status, monthly_credits_used, monthly_credit_limit, addon_credits_balance")
      .in("user_auth_id", authIds);

    const billingMap: Record<string, any> = {};
    for (const b of billingRecords || []) {
      billingMap[b.user_auth_id] = b;
    }

    const userMap: Record<string, any> = {};
    for (const u of users || []) {
      userMap[u.auth_id] = u;
    }

    // Build enriched list ordered by referral date
    const enrichedUsers = referralList.map((r) => {
      const u = userMap[r.referred_user_auth_id];
      const billing = billingMap[r.referred_user_auth_id];
      return {
        auth_id: r.referred_user_auth_id,
        name: u?.name || "Unknown",
        email: u?.email || "Unknown",
        detected_country: u?.detected_country || null,
        status: u?.status || "unknown",
        created_at: u?.created_at || r.created_at,
        referred_at: r.created_at,
        billing: billing
          ? {
              plan_key: billing.plan_key,
              status: billing.status,
              monthly_credits_used: billing.monthly_credits_used,
              monthly_credit_limit: billing.monthly_credit_limit,
              addon_credits_balance: billing.addon_credits_balance,
            }
          : null,
      };
    });

    return NextResponse.json({
      users: enrichedUsers,
      total: enrichedUsers.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Partner access required") {
      return NextResponse.json({ error: "Partner access required" }, { status: 403 });
    }
    console.error("[partner/users] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
