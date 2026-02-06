import type { Id } from "@/convex/_generated/dataModel";

// Dev-mode identity constants.
// After running the `seed.seedDev` mutation from the Convex dashboard,
// replace these values with the returned orgId and userId.
// When Clerk auth is integrated, this file will be removed.

export const DEV_ORG_ID = "jn7bx4jc48hgs93b9szh2bnw3980m6v8" as unknown as Id<"organizations">;
export const DEV_USER_ID = "jx70sfq5e4wghzg4ftc5ew2ny580nh98" as unknown as Id<"users">;

export const IS_DEV_MODE = true;
