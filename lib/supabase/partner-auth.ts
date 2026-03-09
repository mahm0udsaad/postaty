import { requireAuth } from "./auth-helpers";
import { createAdminClient } from "./server";

export async function requirePartnerAccess() {
  const user = await requireAuth();
  const admin = createAdminClient();

  const { data: partner } = await admin
    .from("partners")
    .select("id, referral_code, status")
    .eq("user_auth_id", user.id)
    .eq("status", "active")
    .single();

  if (!partner) {
    throw new Error("Partner access required");
  }

  return { user, partner };
}
