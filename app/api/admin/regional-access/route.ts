import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    // Get all grants with user info
    const { data: grants, error } = await admin
      .from("regional_dashboard_access")
      .select("*")
      .eq("region_key", "mena_local")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/regional-access] Failed to fetch grants:", error);
      return NextResponse.json(
        { error: "Failed to fetch grants" },
        { status: 500 }
      );
    }

    // Enrich with user info
    const authIds = (grants || []).map((g) => g.user_auth_id);
    const { data: users } = await admin
      .from("users")
      .select("auth_id, email, name")
      .in("auth_id", authIds.length > 0 ? authIds : ["__none__"]);

    const userMap: Record<string, { email: string; name: string }> = {};
    for (const u of users || []) {
      userMap[u.auth_id] = { email: u.email, name: u.name };
    }

    // Enrich with granted_by user info
    const grantedByIds = (grants || []).map((g) => g.granted_by);
    const { data: grantedByUsers } = await admin
      .from("users")
      .select("id, email, name")
      .in("id", grantedByIds.length > 0 ? grantedByIds : ["00000000-0000-0000-0000-000000000000"]);

    const grantedByMap: Record<string, { email: string; name: string }> = {};
    for (const u of grantedByUsers || []) {
      grantedByMap[u.id] = { email: u.email, name: u.name };
    }

    const enriched = (grants || []).map((g) => ({
      id: g.id,
      user_auth_id: g.user_auth_id,
      email: userMap[g.user_auth_id]?.email || "Unknown",
      name: userMap[g.user_auth_id]?.name || "Unknown",
      granted_by_name: grantedByMap[g.granted_by]?.name || "Unknown",
      created_at: g.created_at,
    }));

    return NextResponse.json({ grants: enriched });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/regional-access] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const admin = createAdminClient();
    const body = await request.json();
    const { email } = body as { email: string };

    if (!email) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: targetUser } = await admin
      .from("users")
      .select("id, auth_id, email, name")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // Check for duplicate
    const { data: existing } = await admin
      .from("regional_dashboard_access")
      .select("id")
      .eq("user_auth_id", targetUser.auth_id)
      .eq("region_key", "mena_local")
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "المستخدم لديه صلاحية بالفعل" },
        { status: 409 }
      );
    }

    // Insert grant
    const now = Date.now();
    const { error: insertError } = await admin
      .from("regional_dashboard_access")
      .insert({
        user_auth_id: targetUser.auth_id,
        granted_by: adminUser.id,
        region_key: "mena_local",
        created_at: now,
      });

    if (insertError) {
      console.error("[admin/regional-access] Failed to grant:", insertError);
      return NextResponse.json(
        { error: "فشل في منح الصلاحية" },
        { status: 500 }
      );
    }

    // Send notification to the user
    await admin.from("notifications").insert({
      user_auth_id: targetUser.auth_id,
      title: "صلاحية جديدة",
      body: "تم منحك صلاحية الوصول إلى لوحة التحليلات الإقليمية",
      type: "info",
      is_read: false,
      created_at: now,
    });

    return NextResponse.json({
      ok: true,
      grant: {
        user_auth_id: targetUser.auth_id,
        email: targetUser.email,
        name: targetUser.name,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/regional-access] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const grantId = searchParams.get("grantId");

    if (!grantId) {
      return NextResponse.json(
        { error: "grantId is required" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await admin
      .from("regional_dashboard_access")
      .delete()
      .eq("id", grantId);

    if (deleteError) {
      console.error("[admin/regional-access] Failed to revoke:", deleteError);
      return NextResponse.json(
        { error: "فشل في إلغاء الصلاحية" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/regional-access] DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
