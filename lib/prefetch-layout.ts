import { createClient, createAdminClient } from "@/lib/supabase/server";

export type PrefetchedCreditState = {
  planKey: string;
  status: string;
  totalRemaining: number;
  canGenerate: boolean;
} | null;

export type PrefetchedUser = {
  status?: string;
  statusReason?: string;
} | null;

export type LayoutData = {
  user: PrefetchedUser;
  creditState: PrefetchedCreditState;
};

export async function prefetchLayoutData(): Promise<LayoutData> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { user: null, creditState: null };
    }

    const admin = createAdminClient();

    const [userResult, billingResult] = await Promise.all([
      admin
        .from("users")
        .select("status, status_reason")
        .eq("auth_id", authUser.id)
        .single(),
      admin
        .from("billing")
        .select(
          "plan_key, status, monthly_credit_limit, monthly_credits_used, addon_credits_balance"
        )
        .eq("user_auth_id", authUser.id)
        .single(),
    ]);

    const dbUser = userResult.data;
    const billing = billingResult.data;

    const user: PrefetchedUser = dbUser
      ? { status: dbUser.status, statusReason: dbUser.status_reason }
      : null;

    let creditState: PrefetchedCreditState = null;
    if (billing) {
      const monthlyRemaining = Math.max(
        billing.monthly_credit_limit - billing.monthly_credits_used,
        0
      );
      const addonRemaining = billing.addon_credits_balance;
      const totalRemaining = monthlyRemaining + addonRemaining;
      const hasEligibleStatus = ![
        "past_due",
        "canceled",
        "unpaid",
        "incomplete_expired",
      ].includes(billing.status);

      creditState = {
        planKey: billing.plan_key,
        status: billing.status,
        totalRemaining,
        canGenerate: hasEligibleStatus && totalRemaining > 0,
      };
    } else {
      creditState = {
        planKey: "none",
        status: "none",
        totalRemaining: 0,
        canGenerate: false,
      };
    }

    return { user, creditState };
  } catch {
    // If auth fails or DB errors, return nulls — client will fetch as fallback
    return { user: null, creditState: null };
  }
}
