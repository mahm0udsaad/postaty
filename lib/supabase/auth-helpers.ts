import { createClient, createAdminClient } from "./server";

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export async function requireCurrentUser() {
  const user = await requireAuth();
  const admin = createAdminClient();
  const { data: dbUser } = await admin
    .from("users")
    .select("*, organizations(*)")
    .eq("auth_id", user.id)
    .single();
  if (!dbUser) {
    throw new Error("User not found in database");
  }
  return dbUser;
}

export async function requireAdmin() {
  const dbUser = await requireCurrentUser();
  if (dbUser.role !== "admin" && dbUser.role !== "owner") {
    throw new Error("Admin access required");
  }
  return dbUser;
}
