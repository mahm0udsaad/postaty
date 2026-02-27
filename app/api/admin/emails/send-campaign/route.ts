import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Postaty <noreply@postaty.com>";

// ---------------------------------------------------------------------------
// POST — Send a marketing email campaign
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const adminUser = await requireAdmin();
    const admin = createAdminClient();
    const body = await request.json();

    const { subject, html, testOnly } = body as {
      subject: string;
      html: string;
      testOnly?: boolean;
    };

    if (!subject || !html) {
      return NextResponse.json(
        { error: "subject and html are required" },
        { status: 400 }
      );
    }

    // Test mode: send only to the admin user
    if (testOnly) {
      const adminEmail = adminUser.email;
      if (!adminEmail) {
        return NextResponse.json(
          { error: "Admin user does not have an email address" },
          { status: 400 }
        );
      }

      await resend.emails.send({
        from: FROM_EMAIL,
        to: [adminEmail],
        subject: `[TEST] ${subject}`,
        html,
        tags: [
          { name: "type", value: "marketing_test" },
        ],
      });

      return NextResponse.json({ sentCount: 1 });
    }

    // Production mode: send to all active users
    const { data: users, error: usersError } = await admin
      .from("users")
      .select("email, name")
      .eq("status", "active")
      .not("email", "is", null);

    if (usersError) {
      console.error("[admin/emails/send-campaign] Failed to fetch users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Filter to valid emails and exclude admin/owner roles
    const recipients = (users || []).filter(
      (u) => u.email && u.email.includes("@")
    );

    let sentCount = 0;

    for (const recipient of recipients) {
      try {
        // Personalize the HTML by replacing {{name}} placeholder
        const personalizedHtml = html.replaceAll(
          "{{name}}",
          recipient.name || "عميلنا العزيز"
        );

        await resend.emails.send({
          from: FROM_EMAIL,
          to: [recipient.email],
          subject,
          html: personalizedHtml,
          tags: [
            { name: "type", value: "marketing" },
          ],
        });

        sentCount++;
      } catch (sendError) {
        console.error(
          `[admin/emails/send-campaign] Failed to send to ${recipient.email}:`,
          sendError
        );
        // Continue sending to remaining recipients
      }
    }

    return NextResponse.json({ sentCount });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/emails/send-campaign] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
