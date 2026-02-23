import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const authUser = await requireAuth();
    const admin = createAdminClient();

    // Check if any admin/owner already exists
    const { data: existingAdmins, error: adminCheckError } = await admin
      .from("users")
      .select("id, role")
      .in("role", ["admin", "owner"])
      .limit(1);

    if (adminCheckError) {
      console.error("[admin/bootstrap] Failed to check existing admins:", adminCheckError);
      return NextResponse.json(
        { error: "Failed to check existing admins" },
        { status: 500 }
      );
    }

    // Get current user's DB record
    const { data: dbUser } = await admin
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .single();

    const hasExistingAdmin = existingAdmins && existingAdmins.length > 0;

    // If the current user is already an owner, nothing to do
    if (dbUser && dbUser.role === "owner") {
      return NextResponse.json({
        userId: dbUser.id,
        action: "already_owner",
      });
    }

    if (!hasExistingAdmin) {
      // No admin exists — promote current user to owner (first-time bootstrap)
      if (dbUser) {
        const { error: updateError } = await admin
          .from("users")
          .update({ role: "owner" })
          .eq("id", dbUser.id);

        if (updateError) {
          console.error("[admin/bootstrap] Failed to promote user:", updateError);
          return NextResponse.json(
            { error: "Failed to promote user to owner" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          userId: dbUser.id,
          action: "promoted",
        });
      } else {
        // User doesn't exist in DB yet — create with owner role
        const { data: newUser, error: insertError } = await admin
          .from("users")
          .insert({
            auth_id: authUser.id,
            email: authUser.email || "",
            role: "owner",
            created_at: Date.now(),
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("[admin/bootstrap] Failed to create owner user:", insertError);
          return NextResponse.json(
            { error: "Failed to create owner user" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          userId: newUser.id,
          action: "created",
        });
      }
    }

    // Admin already exists — require secret
    const body = await request.json();
    const { secret } = body as { secret?: string };

    const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!bootstrapSecret) {
      return NextResponse.json(
        { error: "ADMIN_BOOTSTRAP_SECRET is not configured" },
        { status: 500 }
      );
    }

    if (!secret || secret !== bootstrapSecret) {
      return NextResponse.json(
        { error: "Invalid bootstrap secret" },
        { status: 403 }
      );
    }

    if (dbUser) {
      const { error: updateError } = await admin
        .from("users")
        .update({ role: "owner" })
        .eq("id", dbUser.id);

      if (updateError) {
        console.error("[admin/bootstrap] Failed to promote user with secret:", updateError);
        return NextResponse.json(
          { error: "Failed to promote user to owner" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        userId: dbUser.id,
        action: "promoted",
      });
    } else {
      const { data: newUser, error: insertError } = await admin
        .from("users")
        .insert({
          auth_id: authUser.id,
          email: authUser.email || "",
          role: "owner",
          created_at: Date.now(),
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[admin/bootstrap] Failed to create owner user:", insertError);
        return NextResponse.json(
          { error: "Failed to create owner user" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        userId: newUser.id,
        action: "created",
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    console.error("[admin/bootstrap] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
