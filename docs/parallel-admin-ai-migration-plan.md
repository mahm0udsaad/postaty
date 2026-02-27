# Parallel Execution Plan: Google Gemini Migration + Admin Dashboard

Date: 2026-02-12

## Goal

1. Replace Vercel AI Gateway with Google Generative AI via AI SDK.
2. Use paid image model: `gemini-3-pro-image-preview`.
3. Use free image model: `gemini-2.5-flash-image`.
4. Build a complete admin dashboard:
   - AI usage vs plan limits
   - Profit analytics (`revenue - Stripe fees - API usage = profit`)
   - Users
   - Chat support
   - Likes/Dislikes (with input from preview modal)
   - Subscriptions
   - Additional operational pages as needed
5. Split work in parallel between two agents.

## Confirmed External Facts (from current docs)

- Google image model IDs are currently:
  - `gemini-3-pro-image-preview`
  - `gemini-2.5-flash-image`
- AI SDK Google provider package: `@ai-sdk/google`.
- AI SDK provider env key: `GOOGLE_GENERATIVE_AI_API_KEY`.
- For text+image output with `generateText`, Gemini requires `responseModalities` including `IMAGE`.
- `gemini-3-pro-image-preview` is paid-only and marked preview.

## Current Project Reality

- Provider is currently Vercel gateway in `lib/ai.ts` using `createGateway(...)`.
- Image generation runs in `lib/generate-designs.ts` via `generateText`.
- Backend is Supabase.
- Billing already exists in Supabase via Stripe (server API routes + Supabase tables).
- No admin route/pages implemented yet.
- Preview modal exists at `app/components/poster-modal.tsx`.

## Parallel Work Split

### Agent A (Me): Backend, data model, provider migration, analytics APIs

1. Provider migration (AI):
   - Remove gateway abstraction in `lib/ai.ts`.
   - Add Google provider wrapper using `@ai-sdk/google`.
   - Update model calls in `lib/generate-designs.ts`:
     - paid path -> `google("gemini-3-pro-image-preview")` or `google.image(...)` path as appropriate.
     - free path -> `google("gemini-2.5-flash-image")` or `google.image(...)`.
   - Ensure image outputs are still extracted correctly.
   - Add `providerOptions.google.responseModalities` where needed for `generateText` image responses.
   - Replace env usage:
     - remove `AI_GATEWAY_URL`, `AI_GATEWAY_API_KEY` dependencies
     - add `GOOGLE_GENERATIVE_AI_API_KEY`.

2. Usage metering + cost accounting:
   - Add Supabase tables for:
     - `aiUsageEvents` (model, route, tokens/images, latency, success/failure, user/org, timestamp).
     - `aiPricingConfig` (effective dates, per-model cost rules, token/image unit costs).
     - `profitSnapshots` or computed query layer.
   - Record usage for each generation request.
   - Build cost engine:
     - compute API cost per event from pricing config.
     - aggregate by day/week/month.

3. Admin analytics APIs (Supabase queries/actions):
   - AI overview metrics:
     - total usage by model
     - free vs paid usage counts
     - plan allowance consumption
   - Financial metrics:
     - gross revenue (Stripe charges/subscriptions/add-ons)
     - estimated Stripe fees
     - API usage cost
     - net profit = revenue - fees - usage.
   - Users/subscriptions operational queries.
   - Likes/dislikes and support ticket APIs for admin views.

4. Schema + migration tasks:
   - Extend Supabase schema with new admin/feedback/support tables.
   - Add secure admin-only query/mutation guards (role checks).
   - Backfill script/mutation for historical generations -> approximate cost rows.

5. Backend acceptance criteria:
   - AI generation works end-to-end on both free and paid paths.
   - Each generation stores usage + cost metadata.
   - Admin queries return consistent totals and profit formula components.
   - No client-facing break in existing create/history/settings flows.

### Agent B (Other Agent): Frontend, admin UI pages, preview modal feedback UX

1. Admin shell and routing:
   - Add `/admin` layout with navigation and auth gating.
   - Pages:
     - `/admin/ai`
     - `/admin/users`
     - `/admin/subscriptions`
     - `/admin/support`
     - `/admin/feedback` (likes/dislikes)
     - `/admin/finance` (or merged into `/admin/ai` with finance section).

2. AI dashboard page requirements (`/admin/ai`):
   - Explain model strategy:
     - free: `gemini-2.5-flash-image`
     - paid: `gemini-3-pro-image-preview`.
   - Show usage by model, org, plan, period.
   - Show plan vs actual usage charts/tables.
   - Profit explainer card:
     - `Profit = Revenue - Stripe Fees - API Usage Cost`
     - include plain-language explanations for each term.
   - Show assumptions/tooltips for fee percentages and pricing logic.

3. Users page (`/admin/users`):
   - list users, roles, org, plan, activity, usage summary.
   - search/filter/sort.

4. Subscriptions page (`/admin/subscriptions`):
   - active/canceled/past_due breakdown.
   - plan distribution and MRR-like indicators.
   - drill-down to user/org.

5. Chat support page (`/admin/support`):
   - ticket list, status, priority, assigned owner.
   - thread view + response composer UI.

6. Likes/Dislikes:
   - Add thumbs up/down controls in `app/components/poster-modal.tsx`.
   - Capture optional reason/comment in modal.
   - Send feedback to backend mutations.
   - Build `/admin/feedback` with filter by model/category/plan/date.

7. Frontend acceptance criteria:
   - Admin pages are mobile/desktop usable.
   - All data loaded via backend admin APIs.
   - Feedback capture from preview modal is persisted and visible in admin.

## Integration Contract Between Agents

1. Shared TypeScript contracts:
   - define response types for each admin page in `lib/types.ts`.
2. API stability:
   - Agent A provides final Supabase function names + payload shapes.
   - Agent B consumes only those stable APIs.
3. Feature flags:
   - admin pages hidden behind admin role.
4. Error handling:
   - loading/empty/error states required on every admin page.

## Execution Order (Parallel)

1. Agent A starts backend provider + schema updates.
2. Agent B starts admin UI shell + placeholder pages and feedback UX.
3. Agent A publishes API contracts.
4. Agent B binds pages to live APIs.
5. Joint QA on: create flow, billing flow, admin analytics correctness.

## Notes / Risks

- Supabase MCP resources are not available in this session, so DB migration is planned against Supabase.
- Gemini 3 Pro Image is preview; pricing/rate limits can change, so pricing config must be data-driven.
- Existing secret values shown in local env/history should be rotated before production use.
