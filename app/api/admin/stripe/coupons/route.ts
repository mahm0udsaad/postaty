import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ---------------------------------------------------------------------------
// GET — List Stripe coupons
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    await requireAdmin();

    const coupons = await stripe.coupons.list({ limit: 100 });
    return NextResponse.json({ coupons: coupons.data });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("[admin/stripe/coupons] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Create or delete Stripe coupons
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      // =====================================================================
      // create_coupon — Create a Stripe coupon
      // =====================================================================
      case "create_coupon": {
        const {
          name,
          duration,
          amountOffCents,
          percentOff,
          currency,
          durationInMonths,
          maxRedemptions,
        } = body as {
          name: string;
          duration: Stripe.CouponCreateParams["duration"];
          amountOffCents?: number;
          percentOff?: number;
          currency?: string;
          durationInMonths?: number;
          maxRedemptions?: number;
        };

        if (!name || !duration) {
          return NextResponse.json(
            { error: "name and duration are required" },
            { status: 400 }
          );
        }

        if (!amountOffCents && !percentOff) {
          return NextResponse.json(
            { error: "Either amountOffCents or percentOff is required" },
            { status: 400 }
          );
        }

        const couponParams: Stripe.CouponCreateParams = {
          name,
          duration,
          ...(amountOffCents && { amount_off: amountOffCents }),
          ...(percentOff && { percent_off: percentOff }),
          ...(currency && { currency: currency.toLowerCase() }),
          ...(durationInMonths && { duration_in_months: durationInMonths }),
          ...(maxRedemptions && { max_redemptions: maxRedemptions }),
        };

        const coupon = await stripe.coupons.create(couponParams);
        return NextResponse.json({ ok: true, coupon });
      }

      // =====================================================================
      // delete_coupon — Delete a Stripe coupon
      // =====================================================================
      case "delete_coupon": {
        const { couponId } = body as { couponId: string };

        if (!couponId) {
          return NextResponse.json(
            { error: "couponId is required" },
            { status: 400 }
          );
        }

        await stripe.coupons.del(couponId);
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[admin/stripe/coupons] Stripe error:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }

    console.error("[admin/stripe/coupons] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
