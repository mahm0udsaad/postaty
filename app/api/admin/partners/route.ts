import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

function generateReferralCode(): string {
  return randomBytes(4).toString("hex"); // 8-char hex string
}

export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: partners, error } = await admin
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/partners] Failed to fetch:", error);
      return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 });
    }

    // Enrich with user info
    const authIds = (partners || []).map((p) => p.user_auth_id);
    const { data: users } = await admin
      .from("users")
      .select("auth_id, email, name")
      .in("auth_id", authIds.length > 0 ? authIds : ["__none__"]);

    const userMap: Record<string, { email: string; name: string }> = {};
    for (const u of users || []) {
      userMap[u.auth_id] = { email: u.email, name: u.name };
    }

    // Count referrals per partner
    const partnerIds = (partners || []).map((p) => p.id);
    let referralCounts: Record<string, number> = {};
    if (partnerIds.length > 0) {
      const { data: referrals } = await admin
        .from("referrals")
        .select("partner_id")
        .in("partner_id", partnerIds);

      for (const r of referrals || []) {
        referralCounts[r.partner_id] = (referralCounts[r.partner_id] || 0) + 1;
      }
    }

    const enriched = (partners || []).map((p) => ({
      id: p.id,
      user_auth_id: p.user_auth_id,
      referral_code: p.referral_code,
      status: p.status,
      email: userMap[p.user_auth_id]?.email || "Unknown",
      name: userMap[p.user_auth_id]?.name || "Unknown",
      referral_count: referralCounts[p.id] || 0,
      created_at: p.created_at,
    }));

    return NextResponse.json({ partners: enriched });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/partners] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const admin = createAdminClient();
    const { email } = (await request.json()) as { email: string };

    if (!email) {
      return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }

    // Find user by email
    const { data: targetUser } = await admin
      .from("users")
      .select("id, auth_id, email, name")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Check if already a partner
    const { data: existing } = await admin
      .from("partners")
      .select("id, status")
      .eq("user_auth_id", targetUser.auth_id)
      .single();

    if (existing) {
      if (existing.status === "disabled") {
        // Re-enable
        await admin
          .from("partners")
          .update({ status: "active" })
          .eq("id", existing.id);
        return NextResponse.json({
          ok: true,
          message: "تم إعادة تفعيل الشريك",
          partner: { email: targetUser.email, name: targetUser.name },
        });
      }
      return NextResponse.json({ error: "المستخدم شريك بالفعل" }, { status: 409 });
    }

    // Generate unique referral code with retry
    let referralCode = generateReferralCode();
    for (let i = 0; i < 3; i++) {
      const { data: codeExists } = await admin
        .from("partners")
        .select("id")
        .eq("referral_code", referralCode)
        .single();
      if (!codeExists) break;
      referralCode = generateReferralCode();
    }

    const now = Date.now();
    const { error: insertError } = await admin.from("partners").insert({
      user_auth_id: targetUser.auth_id,
      referral_code: referralCode,
      status: "active",
      created_by: adminUser.id,
      created_at: now,
    });

    if (insertError) {
      console.error("[admin/partners] Failed to create:", insertError);
      return NextResponse.json({ error: "فشل في إنشاء الشريك" }, { status: 500 });
    }

    // Notify the user
    await admin.from("notifications").insert({
      user_auth_id: targetUser.auth_id,
      title: "شريك جديد",
      body: "تم تفعيلك كشريك! يمكنك الآن الوصول إلى لوحة الشركاء ومشاركة رابط الإحالة الخاص بك.",
      type: "info",
      is_read: false,
      created_at: now,
    });

    return NextResponse.json({
      ok: true,
      partner: {
        email: targetUser.email,
        name: targetUser.name,
        referral_code: referralCode,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/partners] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get("partnerId");

    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
    }

    // Soft-disable (preserve referral history)
    const { error: updateError } = await admin
      .from("partners")
      .update({ status: "disabled" })
      .eq("id", partnerId);

    if (updateError) {
      console.error("[admin/partners] Failed to disable:", updateError);
      return NextResponse.json({ error: "فشل في تعطيل الشريك" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/partners] DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
