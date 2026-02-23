import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// ---------------------------------------------------------------------------
// Default template builder (fallback when AI is unavailable)
// ---------------------------------------------------------------------------
function buildDefaultMarketingTemplate(input: {
  subject: string;
  targetAudience: string;
  campaignGoal: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1d4ed8, #2563eb); color: #ffffff; padding: 20px 24px;">
        <h1 style="margin: 0; font-size: 22px;">Postaty - بوستاتي</h1>
        <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.95;">تصاميم سوشيال ميديا جاهزة للنشر خلال ثوانٍ</p>
      </div>
      <div style="padding: 24px; color: #111827;">
        <p style="margin: 0 0 12px; font-size: 16px;">مرحباً،</p>
        <p style="margin: 0 0 12px; line-height: 1.8;">${input.campaignGoal}</p>
        <ul style="padding-right: 20px; margin: 0 0 18px; line-height: 1.9; color: #374151;">
          <li>توليد تصاميم احترافية بالذكاء الاصطناعي</li>
          <li>أحجام جاهزة لكل منصات التواصل</li>
          <li>سرعة تنفيذ + حفظ هوية العلامة</li>
        </ul>
        <a href="https://www.postaty.com/pricing" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700;">ابدأ الآن</a>
        <p style="margin: 16px 0 0; color: #6b7280; font-size: 13px;">فريق Postaty</p>
      </div>
    </div>
  `;

  return { html, subject: input.subject };
}

// ---------------------------------------------------------------------------
// POST — Generate an AI marketing email template
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { subject, targetAudience, campaignGoal } = body as {
      subject: string;
      targetAudience: string;
      campaignGoal: string;
    };

    if (!subject || !targetAudience || !campaignGoal) {
      return NextResponse.json(
        { error: "subject, targetAudience, and campaignGoal are required" },
        { status: 400 }
      );
    }

    // Try AI generation first
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (apiKey) {
      try {
        const google = createGoogleGenerativeAI({ apiKey });

        const prompt = `You are a senior Arabic email marketer.
Write a short high-converting Arabic marketing email for a SaaS product called Postaty (بوستاتي).
Postaty generates social media designs using AI.

Subject line: ${subject}
Target audience: ${targetAudience}
Campaign goal: ${campaignGoal}

Output strict JSON with keys: subject, headline, intro, bullets (array of 3 short bullets in Arabic), ctaText, closing.
No markdown. Only valid JSON.`;

        const result = await generateText({
          model: google("gemini-2.0-flash"),
          prompt,
          temperature: 0.8,
          maxOutputTokens: 600,
        });

        const raw = result.text ?? "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as {
            subject?: string;
            headline?: string;
            intro?: string;
            bullets?: string[];
            ctaText?: string;
            closing?: string;
          };

          if (parsed.subject && parsed.headline && parsed.intro) {
            const bullets =
              Array.isArray(parsed.bullets) && parsed.bullets.length
                ? parsed.bullets.slice(0, 3)
                : [
                    "تصاميم جاهزة للنشر خلال ثوانٍ",
                    "مناسبة لكل منصات التواصل",
                    "تحافظ على هوية علامتك تلقائياً",
                  ];

            const html = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1d4ed8, #2563eb); color: #ffffff; padding: 20px 24px;">
          <h1 style="margin: 0; font-size: 22px;">${parsed.headline}</h1>
        </div>
        <div style="padding: 24px; color: #111827;">
          <p style="margin: 0 0 12px; font-size: 16px;">مرحباً،</p>
          <p style="margin: 0 0 12px; line-height: 1.8;">${parsed.intro}</p>
          <ul style="padding-right: 20px; margin: 0 0 18px; line-height: 1.9; color: #374151;">
            ${bullets.map((b) => `<li>${b}</li>`).join("")}
          </ul>
          <a href="https://www.postaty.com/pricing" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 700;">${parsed.ctaText ?? "ابدأ الآن"}</a>
          <p style="margin: 16px 0 0; color: #6b7280; font-size: 13px;">${parsed.closing ?? "فريق Postaty"}</p>
        </div>
      </div>
    `;

            return NextResponse.json({
              html,
              subject: parsed.subject,
              source: "ai",
            });
          }
        }
      } catch (aiError) {
        console.error("[admin/emails/generate-template] AI generation failed, using fallback:", aiError);
      }
    }

    // Fallback to default template
    const fallback = buildDefaultMarketingTemplate({
      subject,
      targetAudience,
      campaignGoal,
    });

    return NextResponse.json({
      html: fallback.html,
      subject: fallback.subject,
      source: "default",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/emails/generate-template] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
