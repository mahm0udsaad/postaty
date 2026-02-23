import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();

    const { data: feedback, error } = await admin
      .from("feedback")
      .select("*")
      .eq("user_auth_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch feedback:", error);
      return NextResponse.json(
        { error: "Failed to fetch feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback: feedback ?? [] });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("GET /api/feedback error:", error);
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

    const { rating, comment, model, category, generationId, imageStoragePath } = body;

    if (!rating) {
      return NextResponse.json(
        { error: "rating is required" },
        { status: 400 }
      );
    }

    const { data: feedback, error } = await admin
      .from("feedback")
      .insert({
        user_auth_id: user.id,
        generation_id: generationId || null,
        rating,
        comment: comment || null,
        model: model || null,
        category: category || null,
        image_storage_path: imageStoragePath || null,
        created_at: Date.now(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to submit feedback:", error);
      return NextResponse.json(
        { error: "Failed to submit feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: feedback.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/feedback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
