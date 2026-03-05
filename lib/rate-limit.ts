import { createAdminClient } from "@/lib/supabase/server";

/**
 * Supabase-backed rate limiter. Uses a Postgres RPC function that atomically
 * checks the request count within a sliding window and records the new request.
 *
 * Replaces the old in-memory Map-based rate limiters that leaked memory and
 * didn't work across multiple server instances.
 */
export async function checkRateLimit(
  userId: string,
  action: string = "generate",
  windowSeconds: number = 60,
  maxRequests: number = 5
): Promise<{ allowed: boolean }> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("check_rate_limit", {
    p_user_id: userId,
    p_action: action,
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests,
  });

  if (error) {
    console.error("[rate-limit] RPC error:", error.message);
    // Fail open: allow the request if rate limiting is broken
    // so users aren't locked out due to infra issues
    return { allowed: true };
  }

  return { allowed: data === true };
}
