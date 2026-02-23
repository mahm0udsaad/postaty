import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth-helpers";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const admin = createAdminClient();
    const { returnUrl } = await request.json();

    if (!returnUrl) {
      return NextResponse.json(
        { error: "returnUrl is required" },
        { status: 400 }
      );
    }

    // Get billing record with Stripe customer ID
    const { data: billing } = await admin
      .from("billing")
      .select("stripe_customer_id")
      .eq("user_auth_id", user.id)
      .single();

    if (!billing?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Stripe customer not found for current user" },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("POST /api/billing/portal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
