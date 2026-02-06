import { DEV_ORG_ID, DEV_USER_ID } from "@/lib/dev-auth";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Dev-mode identity hook. Returns hardcoded org/user IDs.
 * Replace with real auth hook when Clerk is integrated.
 */
export function useDevIdentity(): {
  orgId: Id<"organizations">;
  userId: Id<"users">;
  isLoading: boolean;
} {
  return {
    orgId: DEV_ORG_ID,
    userId: DEV_USER_ID,
    isLoading: false,
  };
}
