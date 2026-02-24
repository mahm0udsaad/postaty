import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();

    const { data: tickets, error } = await admin
      .from("support_tickets")
      .select("*")
      .eq("user_auth_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[support] Failed to fetch tickets:", error);
      return NextResponse.json(
        { error: "Failed to fetch tickets" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tickets: tickets ?? [] });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("[support] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();
    const body = await request.json();

    const { subject, message, priority, metadata } = body as {
      subject: string;
      message: string;
      priority?: string;
      metadata?: Record<string, unknown>;
    };

    if (!subject || !message) {
      return NextResponse.json(
        { error: "subject and message are required" },
        { status: 400 }
      );
    }

    const now = Date.now();

    // Create ticket
    const { data: ticket, error: ticketError } = await admin
      .from("support_tickets")
      .insert({
        user_auth_id: user.id,
        subject,
        status: "open",
        priority: priority || "medium",
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (ticketError) {
      console.error("[support] Failed to create ticket:", ticketError);
      return NextResponse.json(
        { error: "Failed to create ticket" },
        { status: 500 }
      );
    }

    // Create initial message
    const { error: msgError } = await admin
      .from("support_messages")
      .insert({
        ticket_id: ticket.id,
        sender_auth_id: user.id,
        is_admin: false,
        body: message,
        created_at: now,
      });

    if (msgError) {
      console.error("[support] Failed to create message:", msgError);
    }

    return NextResponse.json({ id: ticket.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("[support] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
