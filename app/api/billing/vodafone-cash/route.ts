import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();

    const formData = await request.formData();
    const phoneNumber = formData.get("phoneNumber") as string;
    const amountEgp = Number(formData.get("amountEgp"));
    const receiptFile = formData.get("receipt") as File | null;

    if (!phoneNumber || !amountEgp || !receiptFile) {
      return NextResponse.json(
        { error: "phoneNumber, amountEgp, and receipt are required" },
        { status: 400 }
      );
    }

    if (receiptFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Receipt file must be under 5MB" },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const { data: existing } = await admin
      .from("vodafone_payment_requests")
      .select("id")
      .eq("user_auth_id", user.id)
      .eq("status", "pending")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending payment request" },
        { status: 409 }
      );
    }

    // Get user info
    const { data: dbUser } = await admin
      .from("users")
      .select("email, name")
      .eq("auth_id", user.id)
      .single();

    // Upload receipt to Supabase Storage
    const ext = receiptFile.name.split(".").pop() || "jpg";
    const fileName = `${user.id}/${Date.now()}.${ext}`;
    const arrayBuffer = await receiptFile.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from("vodafone-receipts")
      .upload(fileName, arrayBuffer, {
        contentType: receiptFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[vodafone-cash] Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload receipt" },
        { status: 500 }
      );
    }

    const { data: urlData } = admin.storage
      .from("vodafone-receipts")
      .getPublicUrl(fileName);

    // Create payment request
    const { error: insertError } = await admin
      .from("vodafone_payment_requests")
      .insert({
        user_auth_id: user.id,
        user_email: dbUser?.email || "",
        user_name: dbUser?.name || "",
        phone_number: phoneNumber,
        amount_egp: amountEgp,
        receipt_url: urlData.publicUrl,
        status: "pending",
        created_at: Date.now(),
        updated_at: Date.now(),
      });

    if (insertError) {
      console.error("[vodafone-cash] Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create payment request" },
        { status: 500 }
      );
    }

    // Send in-app notification
    await admin.from("notifications").insert({
      user_auth_id: user.id,
      type: "info",
      title: "تم استلام طلب الدفع | Payment request received",
      body: "طلب الدفع عبر فودافون كاش قيد المراجعة. سنرسل لك إشعار عند الموافقة. | Your Vodafone Cash payment is under review. We'll notify you when approved.",
      is_read: false,
      metadata: JSON.stringify({ type: "vodafone_cash_submitted" }),
      created_at: Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/billing/vodafone-cash error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Check if user has a pending request
export async function GET() {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();

    const { data } = await admin
      .from("vodafone_payment_requests")
      .select("id, status, created_at, amount_egp, phone_number")
      .eq("user_auth_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    return NextResponse.json({ request: data?.[0] || null });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("GET /api/billing/vodafone-cash error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
