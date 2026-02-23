import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { id } = await params;

    // Get ticket
    const { data: ticket, error: ticketError } = await admin
      .from("support_tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Get messages
    const { data: messages, error: messagesError } = await admin
      .from("support_messages")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error(
        "[admin/support/[id]] Failed to fetch messages:",
        messagesError
      );
      return NextResponse.json(
        { error: "Failed to fetch ticket messages" },
        { status: 500 }
      );
    }

    // Get user info for ticket owner
    const { data: ticketUser } = await admin
      .from("users")
      .select("auth_id, email, name")
      .eq("auth_id", ticket.user_auth_id)
      .single();

    // Get user info for all message senders
    const senderAuthIds = [
      ...new Set(
        (messages || []).map((m) => m.sender_auth_id).filter(Boolean)
      ),
    ];
    const { data: senderUsers } = await admin
      .from("users")
      .select("auth_id, email, name")
      .in(
        "auth_id",
        senderAuthIds.length > 0 ? senderAuthIds : ["__none__"]
      );

    const sendersByAuthId: Record<
      string,
      { email: string; name: string | null }
    > = {};
    for (const u of senderUsers || []) {
      sendersByAuthId[u.auth_id] = { email: u.email, name: u.name };
    }

    const enrichedMessages = (messages || []).map((m) => ({
      ...m,
      sender: sendersByAuthId[m.sender_auth_id] || null,
    }));

    return NextResponse.json({
      ticket: {
        ...ticket,
        user: ticketUser || null,
      },
      messages: enrichedMessages,
    });
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
    console.error("[admin/support/[id]] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
