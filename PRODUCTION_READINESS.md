# Production Readiness (Social Media Generator)

## Product idea (what this app is)
An Arabic-first (RTL) web app that helps businesses in the MENA market generate **professional social media offer posters** in seconds.

Current flow (as implemented):
- User selects a business category: **restaurant**, **supermarket**, or **online store**.
- User fills a short offer form and uploads required images (logo + product/meal images).
- User picks output formats (Instagram square/story, Facebook post).
- A server action crafts a high-quality poster prompt with **OpenAI GPT‑4o**, then generates final images using a **multimodal image-capable model** via the AI Gateway.
- The UI previews the resulting posters and supports download/share.
- Metadata about successful generations is saved in **Convex**.

## What’s in the repo today (high-level architecture)
- Frontend: Next.js App Router + React (Arabic RTL UI). (`app/page.tsx`, `app/components/*`)
- Server-side generation: Next.js server action `generatePoster`. (`app/actions.ts`)
- AI access: Vercel AI SDK `createGateway` (requires gateway URL + key). (`lib/ai.ts`)
- Prompting: category-specific system prompts + user-message builder. (`lib/prompts.ts`)
- Persistence: Convex schema + mutation/query for generations. (`convex/schema.ts`, `convex/generations.ts`)

## Key findings / gaps (current blockers for production)
### Data & persistence
- Convex “outputs” are currently saved with placeholder `imageUrl` values (e.g. `generated-instagram-square`), not actual stored images. (`app/page.tsx`)
- No real storage strategy yet for generated images (Convex file storage, S3, etc.).

### Security & abuse prevention
- No authentication/authorization: anyone can generate posters and write to the database.
- No rate limiting / quotas / bot protection; AI generation can be expensive and easily abused.
- No server-side validation of user input payloads (including base64 images); relies on client correctness. (`app/actions.ts`)
- No content policy / moderation flow for text and user-uploaded images.

### Reliability & correctness
- Jest tests are out of sync with the current implementation and currently fail. (`__tests__/actions.test.ts`)
- `npm run lint` currently fails due to test typing (`any`) and a `require()` rule hit in `jest.config.js`.
- `next build` succeeds, but prints a warning about an invalid `next.config.ts` option (`serverActions`), meaning your intended request body limit may not be applied. (`next.config.ts`)

### Observability & operations
- No error tracking (Sentry), structured logging, or tracing.
- No health checks / runbook / on-call style operational docs.
- No CI pipeline (tests + lint + build) enforced on PRs.

### Product/UX concerns to confirm before launch
- Expected time-to-generate per format and what happens on slow/failed generations (timeouts, retries, partial success UX).
- “Share” support is browser-dependent; ensure fallback UX is acceptable. (`app/components/poster-preview.tsx`)
- Accessibility baseline (form labels exist, but needs a pass for focus states, error messages, keyboard flows).

## Production checklist (what’s needed before launch)

### 1) Environments & configuration
- [ ] Add `README` deployment section (Vercel + Convex) with exact steps and required env vars.
- [ ] Add `.env.example` with **non-secret** keys:
  - `NEXT_PUBLIC_CONVEX_URL`
  - `AI_GATEWAY_URL`
  - `AI_GATEWAY_API_KEY`
- [ ] Add runtime env validation (fail fast) for required env vars (server + client).
- [ ] Fix/verify `next.config.ts` config for server actions body limits (ensure it’s the correct key for your Next.js version).

### 2) Data storage (generated posters)
- [ ] Decide where generated images live:
  - Option A: Convex file storage (store bytes + keep a storage ID/URL)
  - Option B: Object storage (S3/R2) with signed uploads/downloads
- [ ] Update Convex schema to store real image references (storageId/URL + metadata).
- [ ] Update `saveGeneration` flow to store:
  - Inputs metadata (without raw images)
  - Outputs: real image references + format/aspect ratio + createdAt
- [ ] Add a “My generations / History” screen (optional but useful for real users).

### 3) Security, privacy, and compliance
- [ ] Add authentication (at minimum: admin/user separation; ideally per-tenant/workspace).
- [ ] Add authorization rules for Convex mutations/queries.
- [ ] Add rate limiting + quotas (per user/IP) and optionally CAPTCHA for anonymous usage.
- [ ] Add input validation on the server action using Zod (including size limits and allowed formats).
- [ ] Decide data retention policy for uploads and generated posters; implement deletion.
- [ ] Add Privacy Policy + Terms (uploads are user content; AI processing disclosures).

### 4) AI/Generation robustness & cost control
- [ ] Add request timeouts + cancellation strategy (especially for multi-format generation).
- [ ] Add retries with backoff for transient AI gateway errors (429/5xx).
- [ ] Add concurrency limits (avoid generating too many formats in parallel for one request).
- [ ] Add “cost guardrails”:
  - max formats per request
  - max image count/size
  - daily quota per user
- [ ] Add a “safe prompt” layer and optional moderation checks for text + images.

### 5) Testing, linting, and CI/CD
- [ ] Update unit tests to match the current generator implementation (`generateText` returning `files` for images). (`__tests__/actions.test.ts`, `app/actions.ts`)
- [ ] Make `npm run lint` clean:
  - fix typing in tests (avoid `any`)
  - adjust ESLint config for `jest.config.js` (or convert it to ESM if preferred)
- [ ] Add CI (GitHub Actions or equivalent):
  - `npm ci`
  - `npm run lint`
  - `npm test`
  - `npm run build`
- [ ] Add basic integration tests (happy-path generation mocked at the gateway boundary).

### 6) Observability & operations
- [ ] Add error tracking (Sentry) for client + server.
- [ ] Add structured logs for generation requests (request id, category, formats, durations, outcome).
- [ ] Add performance monitoring (generation latency, error rate).
- [ ] Add alerting thresholds for AI failures, latency spikes, quota breaches.

### 7) Performance & UX polish
- [ ] Re-check upload limits and memory usage (base64 is heavy; keep limits strict).
- [ ] Consider switching to Next `<Image />` where practical (note: data URLs have tradeoffs).
- [ ] Add clear user-facing errors for:
  - invalid images
  - missing env config (in staging/prod)
  - AI service outages
- [ ] Add loading/progress per format (not just global skeleton) and “partial success” messaging.

## Suggested “definition of production-ready”
Minimum bar for a first real launch:
- Tests + lint + build all pass in CI.
- Real image storage implemented (no placeholders).
- Auth + rate limiting in place.
- Input validation + size limits enforced server-side.
- Basic observability (error tracking + logs) added.
- Clear deployment/runbook documentation.

---

## Marketing readiness (what’s missing beyond code)
### Positioning & messaging
- [ ] Define your Ideal Customer Profiles (ICPs): small restaurants, supermarkets, e-commerce sellers, agencies.
- [ ] Define the “core promise” in 1 line (e.g., “بوسترات عروض احترافية خلال 30 ثانية”).
- [ ] Collect 10–20 real examples of current customer posters and define what “better” means (brand, readability, CTR).

### Assets
- [ ] Landing page (Arabic-first) with: demo video, examples gallery, pricing, FAQ, terms/privacy.
- [ ] Brand kit: logo, colors, typography, tone of voice (Arabic).
- [ ] Example outputs per category + per format (Instagram square/story, Facebook post).
- [ ] Social proof plan: early access users, before/after examples, testimonials.

### Funnel & retention
- [ ] Onboarding that gets users to first successful poster fast (guided wizard + defaults).
- [ ] “Save + reuse” (brand kit + last offers) to reduce repeat effort.
- [ ] “Export pack” (download all formats + naming) for daily workflows.
- [ ] Email/WhatsApp follow-up flows (optional) for activation + retention.

### Commercial & legal
- [ ] Privacy Policy + Terms + AI disclosure (uploads + generation + retention).
- [ ] Refund policy, acceptable use policy, and content guidelines.
- [ ] VAT/tax handling approach per target country (consult your accountant).

---

## Feature roadmap (what’s missing product-wise)
### Must-have SaaS features (even for v1 paid)
- [ ] Auth (email/OTP/social) + user accounts.
- [ ] Billing + subscription management (Stripe) + usage metering (credits).
- [ ] Generation history + re-download.
- [ ] Brand kit: logo(s), fonts, colors, WhatsApp number, default CTA/headlines.
- [ ] Templates / styles: “Modern”, “Supermarket flyer”, “Luxury”, “Minimal”.
- [ ] Admin console: users, usage, errors, refunds, bans, feature flags.

### Integrations: Facebook/Instagram and TikTok
What you can integrate (typical scopes; exact depends on app review approval):
- Publish media to business pages (Facebook) and business accounts (Instagram).
- Create drafts or schedule posts (if supported by the platform APIs and your permissions).
- Analytics: post performance pullback (views, clicks) where available.

What’s needed to ship these safely:
- [ ] Meta developer app + App Review (permissions, business verification).
- [ ] TikTok developer app + review (posting APIs, OAuth, compliance).
- [ ] OAuth account connection UX (connect/disconnect, token refresh, scopes).
- [ ] “Workspace” model (users can connect multiple pages/accounts).
- [ ] Audit logs (who posted what, when).
- [ ] Clear failure states (token revoked, permission missing, upload rejected).

### New feature: video generation + voiceover
Suggested v1 approach (fastest path to launch):
- Video is a **template-driven** composition (not fully “AI video”).
- Inputs: product/meal image(s), logo, offer text, prices, CTA, WhatsApp.
- Output: 6–12s vertical video (9:16) optimized for TikTok/Reels/Stories.

Technical pieces to plan:
- [ ] Video renderer: Remotion (React-based) or FFmpeg templating.
- [ ] Voiceover: ElevenLabs (quality) or cheaper TTS (Google/Azure/Polly) with Arabic voices.
- [ ] Background music: licensed library or user uploads (avoid copyright risk).
- [ ] Storage + CDN for video (bigger than images).
- [ ] Rendering queue (video rendering is heavier; needs background jobs).
- [ ] Captions (Arabic RTL) + safe typography.

### “AI Copilot” chatbot (Gen UI) to automate everything
Goal: user chats in Arabic, uploads images, and the assistant:
- asks for missing fields
- suggests headlines/CTA
- confirms brand style
- generates all formats + optionally video + schedules publishing

Implementation outline:
- [ ] Chat state + tool calling (Vercel AI SDK) with a guided form fallback.
- [ ] Tools: “extract offer details”, “validate inputs”, “generate posters”, “create video”, “publish/schedule”.
- [ ] Guardrails: input validation, moderation, rate limits, “confirm before publish”.

---

## Pricing approach (MENA-friendly + affordable)
Recommend pricing as **credits** to keep costs predictable:
- 1 credit = 1 poster in one format (e.g., Instagram square)
- Video credits cost more (rendering + voiceover + storage)

Suggested tiers to validate (examples; tune after measuring real costs):
- Free: limited credits/week + watermark (or low-res)
- Starter: low monthly price, enough for small shops (e.g., 30–60 poster credits/month)
- Pro: higher credits + brand kits + scheduling + no watermark
- Agency: seats + workspaces + bulk credits + team features

To keep it affordable:
- enforce strict limits (image count/size, max formats)
- cache/reuse outputs (re-download doesn’t re-generate)
- offer “Lite” models/styles for cheaper generations
- regional pricing (SAR/AED/EGP) based on purchasing power

---

## What I need from you (accounts + env vars)
### Required today (current app)
- `NEXT_PUBLIC_CONVEX_URL` (Convex deployment URL for the client)
- `AI_GATEWAY_URL` (Vercel AI Gateway base URL)
- `AI_GATEWAY_API_KEY` (gateway key)

### For Stripe billing
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Price/Product IDs you create in Stripe (or generate them from a setup script)
- Vercel domain URLs for redirect/callbacks (success/cancel, customer portal return)

### For Meta (Facebook/Instagram)
- `META_APP_ID`
- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`
- A public callback URL + webhook URL (Vercel) for OAuth + webhooks

### For TikTok
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- TikTok OAuth redirect URLs (Vercel)

### For voiceover (example: ElevenLabs)
- `ELEVENLABS_API_KEY`
- Voice ID(s) you want to use + language requirements

### For storage (if not using Convex storage)
- S3/R2 credentials + bucket + public base URL (or signed URL strategy)

---

## Parallel delivery (how to “vibe code” this efficiently)
In this Codex CLI session you’re talking to one agent, but we can still parallelize the work by splitting into independent tracks and implementing them in separate PRs:
- Track A: core product hardening (auth, validation, storage, CI)
- Track B: billing + plans (Stripe + credits + quotas)
- Track C: publishing integrations (Meta + TikTok)
- Track D: video + voiceover pipeline (renderer + TTS + queue)
- Track E: AI Copilot chat UX (Gen UI + tools)

If you want “multiple models working in parallel”, you can run multiple agents/sessions and assign each a track, then merge. I can provide a task breakdown that’s cleanly separable so parallel work doesn’t conflict.

---

## MCP (Stripe + Convex) planner connection
- Convex MCP: you have a Convex MCP server configured in your Cursor config (`/Users/mahmoudmac/.cursor/mcp.json`), but in *this* Codex run the MCP resource list is currently empty, so I can’t directly query Convex via MCP yet.
- Stripe MCP: not configured here.

If you want me to use MCP tools for planning/automation:
- Add/enable MCP servers in the environment that Codex is running with (Convex + Stripe).
- Then I can discover resources via MCP and generate a plan that matches your actual schema/products/prices.
