import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId is required" },
        { status: 400 }
      );
    }

    // Get ticket
    const { data: ticket, error: ticketError } = await admin
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Get user info
    const { data: user } = await admin
      .from("users")
      .select("email, name")
      .eq("auth_id", ticket.user_auth_id)
      .single();

    // Get messages
    const { data: messages, error: msgError } = await admin
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("[admin/support/thread] Failed to fetch messages:", msgError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ticket: {
        ...ticket,
        user_name: user?.name || "Unknown",
        user_email: user?.email || "",
      },
      messages: messages || [],
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/support/thread] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
