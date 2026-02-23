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
    const statusFilter = searchParams.get("status");

    // Build query
    let query = admin
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.error("[admin/support] Failed to fetch tickets:", error);
      return NextResponse.json(
        { error: "Failed to fetch tickets" },
        { status: 500 }
      );
    }

    const items = tickets || [];

    // Enrich with user info
    const authIds = [
      ...new Set(items.map((t) => t.user_auth_id).filter(Boolean)),
    ];
    const { data: users } = await admin
      .from("users")
      .select("auth_id, email, name")
      .in("auth_id", authIds.length > 0 ? authIds : ["__none__"]);

    const usersByAuthId: Record<
      string,
      { email: string; name: string | null }
    > = {};
    for (const u of users || []) {
      usersByAuthId[u.auth_id] = { email: u.email, name: u.name };
    }

    // Get message counts per ticket
    const ticketIds = items.map((t) => t.id);
    const { data: messages } = await admin
      .from("support_messages")
      .select("ticket_id")
      .in("ticket_id", ticketIds.length > 0 ? ticketIds : ["__none__"]);

    const messageCountByTicket: Record<string, number> = {};
    for (const m of messages || []) {
      messageCountByTicket[m.ticket_id] =
        (messageCountByTicket[m.ticket_id] || 0) + 1;
    }

    const enrichedTickets = items.map((t) => {
      const user = usersByAuthId[t.user_auth_id];
      return {
        ...t,
        user_name: user?.name || "Unknown",
        user_email: user?.email || "",
        message_count: messageCountByTicket[t.id] || 0,
      };
    });

    return NextResponse.json(enrichedTickets);
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
    console.error("[admin/support] GET error:", error);
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
      case "create_ticket": {
        const { userAuthId, subject, priority } = body as {
          userAuthId: string;
          subject: string;
          priority?: string;
        };
        if (!userAuthId || !subject) {
          return NextResponse.json(
            { error: "userAuthId and subject are required" },
            { status: 400 }
          );
        }

        const now = Date.now();

        const { data: ticket, error: insertError } = await admin
          .from("support_tickets")
          .insert({
            user_auth_id: userAuthId,
            subject,
            status: "open",
            priority: priority || "medium",
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (insertError) {
          console.error(
            "[admin/support] Failed to create ticket:",
            insertError
          );
          return NextResponse.json(
            { error: "Failed to create ticket" },
            { status: 500 }
          );
        }

        return NextResponse.json({ ok: true, ticket });
      }

      case "reply": {
        const { ticketId, body: replyBody, messageBody } = body as {
          ticketId: string;
          body?: string;
          messageBody?: string;
        };
        const msgContent = replyBody || messageBody;
        if (!ticketId || !msgContent) {
          return NextResponse.json(
            { error: "ticketId and body are required" },
            { status: 400 }
          );
        }

        const now = Date.now();

        // Insert message
        const { data: message, error: msgError } = await admin
          .from("support_messages")
          .insert({
            ticket_id: ticketId,
            sender_auth_id: adminUser.auth_id,
            is_admin: true,
            body: msgContent,
            created_at: now,
          })
          .select()
          .single();

        if (msgError) {
          console.error("[admin/support] Failed to reply:", msgError);
          return NextResponse.json(
            { error: "Failed to send reply" },
            { status: 500 }
          );
        }

        // Update ticket timestamp
        await admin
          .from("support_tickets")
          .update({ updated_at: now })
          .eq("id", ticketId);

        // Notify the ticket owner
        const { data: ticket } = await admin
          .from("support_tickets")
          .select("user_auth_id, subject")
          .eq("id", ticketId)
          .single();

        if (ticket) {
          await admin.from("notifications").insert({
            user_auth_id: ticket.user_auth_id,
            title: "New Support Reply",
            body: `You have a new reply on your ticket: "${ticket.subject}"`,
            type: "info",
            is_read: false,
            metadata: JSON.stringify({ ticketId }),
            created_at: now,
          });
        }

        return NextResponse.json({ ok: true, message });
      }

      case "update_status": {
        const { ticketId, status } = body as {
          ticketId: string;
          status: string;
        };
        if (!ticketId || !status) {
          return NextResponse.json(
            { error: "ticketId and status are required" },
            { status: 400 }
          );
        }

        const validStatuses = [
          "open",
          "in_progress",
          "waiting_on_customer",
          "resolved",
          "closed",
        ];
        if (!validStatuses.includes(status)) {
          return NextResponse.json(
            {
              error: `status must be one of: ${validStatuses.join(", ")}`,
            },
            { status: 400 }
          );
        }

        const now = Date.now();

        const { error: updateError } = await admin
          .from("support_tickets")
          .update({ status, updated_at: now })
          .eq("id", ticketId);

        if (updateError) {
          console.error(
            "[admin/support] Failed to update status:",
            updateError
          );
          return NextResponse.json(
            { error: "Failed to update ticket status" },
            { status: 500 }
          );
        }

        return NextResponse.json({ ok: true, status });
      }

      case "assign": {
        const { ticketId, assignedTo } = body as {
          ticketId: string;
          assignedTo: string | null;
        };
        if (!ticketId) {
          return NextResponse.json(
            { error: "ticketId is required" },
            { status: 400 }
          );
        }

        const now = Date.now();

        const { error: updateError } = await admin
          .from("support_tickets")
          .update({
            assigned_to: assignedTo || null,
            updated_at: now,
          })
          .eq("id", ticketId);

        if (updateError) {
          console.error(
            "[admin/support] Failed to assign ticket:",
            updateError
          );
          return NextResponse.json(
            { error: "Failed to assign ticket" },
            { status: 500 }
          );
        }

        return NextResponse.json({ ok: true, assignedTo: assignedTo || null });
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
    console.error("[admin/support] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
