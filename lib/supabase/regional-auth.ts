import { requireAuth } from "./auth-helpers";
import { createAdminClient } from "./server";

const ADMIN_EMAILS = [
  "postatyhq@gmail.com",
  "101mahm0udsaad@gmail.com",
];

export const REGIONAL_COUNTRIES = ["JO", "PS", "IL"] as const;

export async function requireRegionalAccess(regionKey = "mena_local") {
  const user = await requireAuth();

  // Admins always have access
  if (ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    return user;
  }

  // Check for explicit grant
  const admin = createAdminClient();
  const { data: grant } = await admin
    .from("regional_dashboard_access")
    .select("id")
    .eq("user_auth_id", user.id)
    .eq("region_key", regionKey)
    .single();

  if (!grant) {
    throw new Error("Regional access required");
  }

  return user;
}
