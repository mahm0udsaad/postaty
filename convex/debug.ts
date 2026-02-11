import { query } from "./_generated/server";

export const whoAmI = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return {
      isAuthenticated: identity !== null,
      subject: identity?.subject ?? null,
      issuer: identity?.issuer ?? null,
      tokenIdentifier: identity?.tokenIdentifier ?? null,
    };
  },
});
