import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { email, name, detectedCountry, referralCode } = await request.json();
    const admin = createAdminClient();
    const now = Date.now();

    // Check if user already exists
    const { data: existingUser } = await admin
      .from("users")
      .select("id, org_id")
      .eq("auth_id", user.id)
      .single();

    if (existingUser) {
      // Update last seen
      await admin
        .from("users")
        .update({ last_seen_at: now })
        .eq("id", existingUser.id);

      return NextResponse.json({ ok: true, userId: existingUser.id });
    }

    // Create org + user + billing for new sign-up
    const slug =
      (email as string).split("@")[0].replace(/[^a-z0-9]/gi, "-").toLowerCase() +
      "-" +
      Math.random().toString(36).slice(2, 8);

    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({
        name: name || "My Organization",
        slug,
        plan: "free",
        credits_balance: 0,
        credits_monthly_allowance: 0,
        current_period_start: now,
        created_at: now,
      })
      .select("id")
      .single();

    if (orgError) {
      console.error("Failed to create org:", orgError);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    const { data: newUser, error: userError } = await admin
      .from("users")
      .insert({
        auth_id: user.id,
        email: email || user.email,
        name: name || "User",
        org_id: org.id,
        role: "member",
        onboarded: false,
        detected_country: detectedCountry || null,
        pricing_country: detectedCountry || null,
        country_source: detectedCountry ? "vercel_geo" : null,
        last_seen_at: now,
        status: "active",
        created_at: now,
      })
      .select("id")
      .single();

    if (userError) {
      console.error("Failed to create user:", userError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Initialize billing with 10 free credits for new users
    const FREE_TIER_CREDITS = 10;
    const { data: billing } = await admin
      .from("billing")
      .insert({
        user_auth_id: user.id,
        plan_key: "none",
        status: "none",
        monthly_credit_limit: 0,
        monthly_credits_used: 0,
        addon_credits_balance: FREE_TIER_CREDITS,
        updated_at: now,
        created_at: now,
      })
      .select("id")
      .single();

    // Record the free credits in the ledger
    if (billing) {
      await admin.from("credit_ledger").insert({
        user_auth_id: user.id,
        billing_id: billing.id,
        amount: FREE_TIER_CREDITS,
        reason: "manual_adjustment",
        source: "addon",
        idempotency_key: `free_tier_${user.id}`,
        monthly_credits_used_after: 0,
        addon_credits_balance_after: FREE_TIER_CREDITS,
        created_at: now,
      });
    }

    // Track referral if a referral code was provided
    if (referralCode && typeof referralCode === "string") {
      try {
        const { data: partner } = await admin
          .from("partners")
          .select("id")
          .eq("referral_code", referralCode)
          .eq("status", "active")
          .single();

        if (partner) {
          await admin.from("referrals").insert({
            partner_id: partner.id,
            referred_user_auth_id: user.id,
            created_at: now,
          });
        }
      } catch {
        // Never block user creation for referral tracking failures
        console.error("[auth/sync] Referral tracking failed for code:", referralCode);
      }
    }

    return NextResponse.json({ ok: true, userId: newUser.id });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
