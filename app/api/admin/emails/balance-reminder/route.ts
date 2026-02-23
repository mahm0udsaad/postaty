import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Postaty <onboarding@resend.dev>";

// ---------------------------------------------------------------------------
// Build the balance reminder email template (ported from convex/emailing.ts)
// ---------------------------------------------------------------------------
function buildBalanceReminderTemplate(input: {
  name: string;
  totalRemaining: number;
}) {
  const subject = "تنبيه الرصيد - Postaty";
  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f59e0b, #f97316); color: #111827; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 21px;">تنبيه الرصيد</h2>
      </div>
      <div style="padding: 24px; color: #111827;">
        <p style="margin: 0 0 12px; font-size: 16px;">مرحباً ${input.name}،</p>
        <p style="margin: 0 0 12px; line-height: 1.8;">رصيدك الحالي هو <strong>${input.totalRemaining}</strong> رصيد.</p>
        <p style="margin: 0 0 16px; line-height: 1.8;">لضمان استمرار إنشاء التصاميم بدون توقف، ننصح بشحن الرصيد الآن.</p>
        <a href="https://www.postaty.com/checkout?addon=addon_5" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700;">شحن الرصيد</a>
      </div>
    </div>
  `;

  return { subject, html };
}

// ---------------------------------------------------------------------------
// POST — Send balance reminder emails to users with low addon credits
// ---------------------------------------------------------------------------
export async function POST() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    // Query billing records with low addon_credits_balance (<=3)
    const { data: billingRecords, error: billingError } = await admin
      .from("billing")
      .select("user_auth_id, addon_credits_balance")
      .lte("addon_credits_balance", 3);

    if (billingError) {
      console.error("[admin/emails/balance-reminder] Failed to fetch billing records:", billingError);
      return NextResponse.json(
        { error: "Failed to fetch billing records" },
        { status: 500 }
      );
    }

    if (!billingRecords || billingRecords.length === 0) {
      return NextResponse.json({ sentCount: 0 });
    }

    // Get the auth_ids to look up user details
    const authIds = billingRecords.map((b) => b.user_auth_id);

    const { data: users, error: usersError } = await admin
      .from("users")
      .select("auth_id, email, name, status, role")
      .in("auth_id", authIds);

    if (usersError) {
      console.error("[admin/emails/balance-reminder] Failed to fetch users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Build a map of auth_id -> user for quick lookup
    const usersByAuthId: Record<string, (typeof users)[0]> = {};
    for (const user of users || []) {
      usersByAuthId[user.auth_id] = user;
    }

    let sentCount = 0;

    for (const billing of billingRecords) {
      const user = usersByAuthId[billing.user_auth_id];

      // Skip if user not found, no email, or inactive/admin
      if (!user) continue;
      if (!user.email || !user.email.includes("@")) continue;
      if (user.status === "banned" || user.status === "suspended") continue;
      if (user.role === "owner" || user.role === "admin") continue;

      try {
        const template = buildBalanceReminderTemplate({
          name: user.name || "عميلنا العزيز",
          totalRemaining: billing.addon_credits_balance ?? 0,
        });

        await resend.emails.send({
          from: FROM_EMAIL,
          to: [user.email],
          subject: template.subject,
          html: template.html,
          tags: [
            { name: "type", value: "balance_reminder" },
          ],
        });

        sentCount++;
      } catch (sendError) {
        console.error(
          `[admin/emails/balance-reminder] Failed to send to ${user.email}:`,
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
    console.error("[admin/emails/balance-reminder] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
