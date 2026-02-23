import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100"),
      500
    );

    // Fetch users
    const { data: users, error: usersError } = await admin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (usersError) {
      console.error("[admin/users] Failed to fetch users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Fetch all billing records to enrich users
    const authIds = (users || []).map((u) => u.auth_id);
    const { data: billingRecords } = await admin
      .from("billing")
      .select("*")
      .in("user_auth_id", authIds);

    const billingByAuthId: Record<string, NonNullable<typeof billingRecords>[0]> = {};
    for (const b of billingRecords || []) {
      billingByAuthId[b.user_auth_id] = b;
    }

    const enrichedUsers = (users || []).map((u) => {
      const billing = billingByAuthId[u.auth_id] || null;
      return {
        ...u,
        billing,
      };
    });

    return NextResponse.json({ users: enrichedUsers });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    console.error("[admin/users] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const admin = createAdminClient();
    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      case "suspend":
      case "ban":
      case "reinstate": {
        const { userId, reason } = body as {
          userId: string;
          reason?: string;
        };
        if (!userId) {
          return NextResponse.json(
            { error: "userId is required" },
            { status: 400 }
          );
        }

        const newStatus =
          action === "reinstate" ? "active" : action === "ban" ? "banned" : "suspended";
        const now = Date.now();

        // Update user status
        const { error: updateError } = await admin
          .from("users")
          .update({
            status: newStatus,
            status_reason: reason || null,
            status_updated_at: now,
          })
          .eq("id", userId);

        if (updateError) {
          console.error(`[admin/users] Failed to ${action} user:`, updateError);
          return NextResponse.json(
            { error: `Failed to ${action} user` },
            { status: 500 }
          );
        }

        // Get user for notification
        const { data: targetUser } = await admin
          .from("users")
          .select("auth_id")
          .eq("id", userId)
          .single();

        if (targetUser) {
          // Create audit log
          await admin.from("audit_logs").insert({
            org_id: adminUser.org_id,
            user_id: adminUser.id,
            action: `user.${action}`,
            resource_type: "user",
            resource_id: userId,
            metadata: JSON.stringify({ reason: reason || null }),
            created_at: now,
          });

          // Send notification to user
          const notificationMessages: Record<string, { title: string; body: string }> = {
            suspend: {
              title: "Account Suspended",
              body: reason
                ? `Your account has been suspended. Reason: ${reason}`
                : "Your account has been suspended. Contact support for details.",
            },
            ban: {
              title: "Account Banned",
              body: reason
                ? `Your account has been banned. Reason: ${reason}`
                : "Your account has been banned.",
            },
            reinstate: {
              title: "Account Reinstated",
              body: "Your account has been reinstated. You can now use the platform again.",
            },
          };

          await admin.from("notifications").insert({
            user_auth_id: targetUser.auth_id,
            title: notificationMessages[action].title,
            body: notificationMessages[action].body,
            type: "system",
            is_read: false,
            created_at: now,
          });
        }

        return NextResponse.json({ ok: true, status: newStatus });
      }

      case "add_credits": {
        const { userId, amount, reason } = body as {
          userId: string;
          amount: number;
          reason?: string;
        };
        if (!userId || typeof amount !== "number" || amount <= 0) {
          return NextResponse.json(
            { error: "userId and a positive amount are required" },
            { status: 400 }
          );
        }

        // Get user's auth_id
        const { data: targetUser } = await admin
          .from("users")
          .select("auth_id")
          .eq("id", userId)
          .single();

        if (!targetUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        // Get billing record
        const { data: billing } = await admin
          .from("billing")
          .select("*")
          .eq("user_auth_id", targetUser.auth_id)
          .single();

        if (!billing) {
          return NextResponse.json(
            { error: "Billing record not found for user" },
            { status: 404 }
          );
        }

        const now = Date.now();
        const newAddonBalance = billing.addon_credits_balance + amount;

        // Update billing
        const { error: billingError } = await admin
          .from("billing")
          .update({
            addon_credits_balance: newAddonBalance,
            updated_at: now,
          })
          .eq("id", billing.id);

        if (billingError) {
          console.error("[admin/users] Failed to add credits:", billingError);
          return NextResponse.json(
            { error: "Failed to add credits" },
            { status: 500 }
          );
        }

        // Create credit ledger entry
        await admin.from("credit_ledger").insert({
          user_auth_id: targetUser.auth_id,
          billing_id: billing.id,
          amount,
          reason: "manual_adjustment",
          source: "system",
          idempotency_key: `admin_${adminUser.id}_${Date.now()}`,
          monthly_credits_used_after: billing.monthly_credits_used,
          addon_credits_balance_after: newAddonBalance,
          created_at: now,
        });

        // Audit log
        await admin.from("audit_logs").insert({
          org_id: adminUser.org_id,
          user_id: adminUser.id,
          action: "credits.add",
          resource_type: "billing",
          resource_id: billing.id,
          metadata: JSON.stringify({ amount, reason: reason || "Admin credit grant" }),
          created_at: now,
        });

        // Notify user
        await admin.from("notifications").insert({
          user_auth_id: targetUser.auth_id,
          title: "Credits Added",
          body: `${amount} credits have been added to your account.${reason ? ` Reason: ${reason}` : ""}`,
          type: "credit",
          is_read: false,
          created_at: now,
        });

        return NextResponse.json({
          ok: true,
          newAddonBalance,
          adjustedBy: amount,
        });
      }

      case "update_role": {
        const { userId, role } = body as {
          userId: string;
          role: string;
        };
        if (!userId || !role) {
          return NextResponse.json(
            { error: "userId and role are required" },
            { status: 400 }
          );
        }

        const validRoles = ["member", "admin", "owner"];
        if (!validRoles.includes(role)) {
          return NextResponse.json(
            { error: `role must be one of: ${validRoles.join(", ")}` },
            { status: 400 }
          );
        }

        // Prevent changing own role
        if (userId === adminUser.id) {
          return NextResponse.json(
            { error: "Cannot change your own role" },
            { status: 400 }
          );
        }

        const now = Date.now();

        const { error: updateError } = await admin
          .from("users")
          .update({ role })
          .eq("id", userId);

        if (updateError) {
          console.error("[admin/users] Failed to update role:", updateError);
          return NextResponse.json(
            { error: "Failed to update role" },
            { status: 500 }
          );
        }

        // Audit log
        await admin.from("audit_logs").insert({
          org_id: adminUser.org_id,
          user_id: adminUser.id,
          action: "user.update_role",
          resource_type: "user",
          resource_id: userId,
          metadata: JSON.stringify({ newRole: role }),
          created_at: now,
        });

        return NextResponse.json({ ok: true, role });
      }

      case "send_notification": {
        const { userId, title, notificationBody, type } = body as {
          userId: string;
          title: string;
          notificationBody: string;
          type?: string;
        };
        if (!userId || !title || !notificationBody) {
          return NextResponse.json(
            { error: "userId, title, and notificationBody are required" },
            { status: 400 }
          );
        }

        // Get user's auth_id
        const { data: targetUser } = await admin
          .from("users")
          .select("auth_id")
          .eq("id", userId)
          .single();

        if (!targetUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        const now = Date.now();

        const { error: insertError } = await admin
          .from("notifications")
          .insert({
            user_auth_id: targetUser.auth_id,
            title,
            body: notificationBody,
            type: type || "info",
            is_read: false,
            created_at: now,
          });

        if (insertError) {
          console.error(
            "[admin/users] Failed to send notification:",
            insertError
          );
          return NextResponse.json(
            { error: "Failed to send notification" },
            { status: 500 }
          );
        }

        return NextResponse.json({ ok: true });
      }

      case "send_bulk_notification": {
        const { userIds, title, notificationBody, type } = body as {
          userIds: string[];
          title: string;
          notificationBody: string;
          type?: string;
        };
        if (
          !userIds ||
          !Array.isArray(userIds) ||
          userIds.length === 0 ||
          !title ||
          !notificationBody
        ) {
          return NextResponse.json(
            {
              error:
                "userIds (non-empty array), title, and notificationBody are required",
            },
            { status: 400 }
          );
        }

        // Get auth_ids for all target users
        const { data: targetUsers } = await admin
          .from("users")
          .select("id, auth_id")
          .in("id", userIds);

        if (!targetUsers || targetUsers.length === 0) {
          return NextResponse.json(
            { error: "No valid users found" },
            { status: 404 }
          );
        }

        const now = Date.now();
        const notifications = targetUsers.map((u) => ({
          user_auth_id: u.auth_id,
          title,
          body: notificationBody,
          type: type || "info",
          is_read: false,
          created_at: now,
        }));

        const { error: insertError } = await admin
          .from("notifications")
          .insert(notifications);

        if (insertError) {
          console.error(
            "[admin/users] Failed to send bulk notifications:",
            insertError
          );
          return NextResponse.json(
            { error: "Failed to send bulk notifications" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          ok: true,
          sent: targetUsers.length,
          requested: userIds.length,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    console.error("[admin/users] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
