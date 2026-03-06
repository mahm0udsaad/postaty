import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";

export async function GET() {
  try {
    const admin = createAdminClient();

    const { data: rows, error } = await admin
      .from("showcase_images")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch showcase images:", error);
      return NextResponse.json(
        { error: "Failed to fetch showcase images" },
        { status: 500 }
      );
    }

    // Resolve storage_path → public URL
    const showcaseImages = (rows ?? []).map((img) => {
      let url: string | null = null;
      if (img.storage_path) {
        // If already a full URL (e.g. from generations bucket), use directly
        if (img.storage_path.startsWith("http")) {
          url = img.storage_path;
        } else {
          const { data } = admin.storage.from("showcase").getPublicUrl(img.storage_path);
          url = data.publicUrl;
        }
      }
      return { ...img, url };
    });

    return NextResponse.json({ showcaseImages });
  } catch (error) {
    console.error("GET /api/showcase error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const dbUser = await requireAdmin();
    const body = await request.json();
    const admin = createAdminClient();

    const { action, id, title, storage_path, url, category, display_order, order } = body;

    // Handle reorder action
    if (action === "reorder") {
      if (!id) {
        return NextResponse.json({ error: "id is required for reorder" }, { status: 400 });
      }
      const { error } = await admin
        .from("showcase_images")
        .update({ display_order: order ?? 0 })
        .eq("id", id);
      if (error) {
        console.error("Failed to reorder showcase image:", error);
        return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    // Use url (from generation) or storage_path
    const resolvedPath = url || storage_path;

    if (!resolvedPath) {
      return NextResponse.json(
        { error: "url or storage_path is required" },
        { status: 400 }
      );
    }

    const { data: showcaseImage, error } = await admin
      .from("showcase_images")
      .insert({
        title: title || null,
        storage_path: resolvedPath,
        category: category || null,
        display_order: display_order ?? order ?? 0,
        added_by: dbUser.id,
        created_at: Date.now(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("Failed to create showcase image:", error);
      return NextResponse.json(
        { error: "Failed to create showcase image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ showcaseImage }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("POST /api/showcase error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("showcase_images")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete showcase image:", error);
      return NextResponse.json(
        { error: "Failed to delete showcase image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("DELETE /api/showcase error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
