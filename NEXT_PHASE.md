# Next Phase — Implementation Guide

## What was completed (Backend Foundation)

| Deliverable | File(s) | Status |
|-------------|---------|--------|
| Convex schema — 7 tables with indexes | `convex/schema.ts` | Done |
| TypeScript types — brand kit, template layers, credits, plans | `lib/types.ts` | Done |
| Zod validation — all form inputs, brand kit, image size/type | `lib/validation.ts` | Done |
| Brand kit CRUD — save, update, delete, getDefault, style seed | `convex/brandKits.ts` | Done |
| Template CRUD — create, fork, versioning, system/org queries | `convex/templates.ts` | Done |
| Credits ledger — atomic debit/credit, refund, balance query | `convex/credits.ts` | Done |
| Generations — status mgmt, org scoping, storage URLs, upload URL | `convex/generations.ts` | Done |
| Organizations — CRUD, plan limits, slug uniqueness | `convex/organizations.ts` | Done |
| Users — getOrCreate (Clerk sync), role management | `convex/users.ts` | Done |
| Audit logs — write + query by org/action | `convex/auditLogs.ts` | Done |
| Prompt builder — brand kit injection, negative prompts, style seed | `lib/prompts.ts` | Done |
| Constants — 6 formats, template categories, style adjectives, plan limits | `lib/constants.ts` | Done |
| Server action — Zod validation + brand kit parameter | `app/actions.ts` | Done |
| next.config.ts — fixed serverActions path, added Convex remote patterns | `next.config.ts` | Done |

**Build status:** Passing (zero TS errors, clean `next build`)

---

## Phase 1 Remaining — Auth, Pages, Storage

### Task 1: Clerk + Convex Auth Integration

**Goal:** Protect all routes and Convex mutations. Users must sign in. Every record is scoped to an organization.

**Dependencies to install:**
```bash
bun add @clerk/nextjs
```

**Files to create/modify:**

1. **`convex/auth.config.ts`** — Clerk JWT issuer configuration
```ts
export default {
  providers: [{
    domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
    applicationID: "convex",
  }],
};
```

2. **`middleware.ts`** (project root) — Clerk middleware for route protection
```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

3. **`app/layout.tsx`** — Wrap with `ClerkProvider`
```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { arSA } from "@clerk/localizations";

// Wrap existing layout:
<ClerkProvider localization={arSA}>
  <ConvexProviderWithClerk>
    {children}
  </ConvexProviderWithClerk>
</ClerkProvider>
```

4. **`app/components/convex-provider.tsx`** — Replace with `ConvexProviderWithClerk`
```tsx
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

export function ConvexClientProvider({ children }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
```

5. **`app/sign-in/[[...sign-in]]/page.tsx`** and **`app/sign-up/[[...sign-up]]/page.tsx`** — Clerk sign-in/sign-up pages

6. **`lib/auth.ts`** — Helper to get current user + org from Convex
```ts
// Server-side helper for Server Actions:
// - Get Clerk user identity
// - Look up or create Convex user + org
// - Return { userId, orgId } for use in mutations
```

**Env vars needed:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev
```

**Acceptance criteria:**
- [ ] Unauthenticated users see a sign-in page on `/dashboard`, `/brand-kit`, `/history`, `/templates`
- [ ] `/` (landing/generate page) works without auth (public)
- [ ] After sign-in, a Convex user + org record are auto-created
- [ ] All Convex mutations validate `ctx.auth.getUserIdentity()` (reject if null)

---

### Task 2: Brand Kit Settings Page (`/brand-kit`)

**Goal:** User uploads logo, system extracts palette, user configures style rules.

**Files to create:**

1. **`app/brand-kit/page.tsx`** — RSC shell that fetches brand kit data
2. **`app/brand-kit/brand-kit-form.tsx`** — Client Component with:
   - Logo upload (reuse existing `ImageUpload` component)
   - Auto-extracted palette display (editable color pickers)
   - Style adjective picker (chip selector from `STYLE_ADJECTIVE_OPTIONS`)
   - Do/Don't rules (text input lists)
   - Font family selector
   - "Set as default" toggle
   - Save button → calls `api.brandKits.save`

3. **`lib/brand-extraction.ts`** — Logo color extraction
   - Takes a base64 image
   - Uses canvas (client-side) to resize to 64x64
   - Implements simple k-means (k=5) on RGB pixels
   - Returns top 5 hex colors sorted by frequency
   - Suggests palette: primary (most dominant non-white/black), secondary, accent, background, text

**UI layout:**
```
┌─────────────────────────────────────────┐
│  هوية العلامة التجارية                    │
│                                         │
│  ┌──────┐  Brand Name: [________]       │
│  │ LOGO │  Font: [dropdown________]     │
│  └──────┘                               │
│                                         │
│  Extracted Colors: ● ● ● ● ●           │
│                                         │
│  Palette:                               │
│  Primary [#___] Secondary [#___]        │
│  Accent  [#___] Background [#___]       │
│  Text    [#___]                         │
│                                         │
│  Style: [luxury] [modern] [warm] ...    │
│                                         │
│  Do Rules:                              │
│  + [______________________________]     │
│  + [______________________________]     │
│                                         │
│  Don't Rules:                           │
│  + [______________________________]     │
│                                         │
│  [  حفظ الهوية  ]                        │
└─────────────────────────────────────────┘
```

**Acceptance criteria:**
- [ ] Upload logo → see extracted colors within 1 second
- [ ] Edit palette manually → save → reload → values persist
- [ ] Style adjectives can be toggled on/off (max 5)
- [ ] Brand kit data is stored in Convex and scoped to org

---

### Task 3: Generation History Page (`/history`)

**Goal:** List all past generations for the current org. Show status, thumbnails, allow re-download.

**Files to create:**

1. **`app/history/page.tsx`** — RSC page
2. **`app/history/generation-card.tsx`** — Client Component for each generation

**Data flow:**
- RSC fetches `api.generations.listByOrg({ orgId })` via `preloadQuery` or Convex's server-side helpers
- Each card shows: date, category badge, business name, status, thumbnail grid
- Click card → expand to see all format outputs + download buttons
- Failed generations show error + "Retry" button (future — for now just show error)

**Acceptance criteria:**
- [ ] Page loads with real data from Convex
- [ ] Generations sorted newest first
- [ ] Each generation shows status (complete/partial/failed) with appropriate badge
- [ ] Download button works for completed outputs (from Convex storage URL)

---

### Task 4: Template Browser Page (`/templates`)

**Goal:** Display system templates in a browsable grid. Users can preview and select a template before generating.

**Files to create:**

1. **`app/templates/page.tsx`** — RSC page with category filter tabs
2. **`app/templates/template-card.tsx`** — Client Component for preview card
3. **`convex/seedTemplates.ts`** — Seed script to insert 10+ system templates

**Template seed data:**
Create 10-15 system templates across categories (sale, food, minimal, luxury, general). Each template is a JSON layer definition following the `TemplateLayer[]` schema in `lib/types.ts`. Templates don't need preview images initially — use a placeholder or generate previews later.

**Category filter tabs:**
```
[الكل] [عروض] [طعام] [بسيط] [فاخر] [الكترونيات] [أزياء] [عام]
```

**Acceptance criteria:**
- [ ] Page shows all system templates in a responsive grid
- [ ] Category filter works (client-side filtering is fine)
- [ ] Each card shows: name, category badge, supported formats, preview placeholder
- [ ] Click "Use template" → navigates to generate page with template pre-selected (or just stores selection in state for now)

---

### Task 5: Wire Up Convex File Storage for Generated Images

**Goal:** Generated poster images are persisted in Convex storage instead of being returned as ephemeral base64.

**Changes needed:**

1. **`app/actions.ts`** — After generating an image:
   - Convert base64 to Blob
   - Upload to Convex storage via `generateUploadUrl` + fetch POST
   - Call `api.generations.updateOutput` with storageId + dimensions
   - Still return base64 to the client for immediate preview

2. **`app/page.tsx`** — Re-enable the Convex save flow:
   - After `generatePoster` returns, call `api.generations.create` with orgId/userId
   - Then upload each output image to Convex storage

3. **`app/components/poster-preview.tsx`** — Support both base64 (immediate) and Convex URL (from history):
   - If `imageBase64` is present → use data URL (current behavior)
   - If `storageUrl` is present → use `<Image>` with Convex URL

**Flow diagram:**
```
Client submits form
    ↓
Server Action: validate → generate images → return base64 results
    ↓
Client: display preview immediately (base64)
    ↓
Client: upload each base64 → Convex storage (via generateUploadUrl)
    ↓
Client: save generation record with storage IDs
    ↓
History page: load from Convex storage URLs
```

**Acceptance criteria:**
- [ ] Generated images survive page refresh
- [ ] History page shows real thumbnails from Convex storage
- [ ] Download from history works with Convex storage URLs
- [ ] Storage IDs are properly recorded in the generation record

---

### Task 6: Connect Generation Flow to Brand Kit

**Goal:** When generating a poster, pass the user's default brand kit into the prompt.

**Changes needed:**

1. **`app/page.tsx`** (or new `/generate` page) — Fetch default brand kit on load:
   ```ts
   const brandKit = useQuery(api.brandKits.getDefault, { orgId });
   ```
2. Pass brand kit data to `generatePoster(data, brandKitPromptData)` in the server action call
3. Show a small "brand kit active" indicator in the generation form

**Acceptance criteria:**
- [ ] If user has a default brand kit, it's automatically used in generation
- [ ] Generated posters reflect brand colors (hex codes appear in the crafted prompt)
- [ ] User can still generate without a brand kit (optional)

---

## Phase 1 Definition of Done

All of the above tasks must be complete before moving to Phase 2. The minimum bar:

- [ ] User can sign up / sign in (Clerk)
- [ ] User auto-gets an org + free plan
- [ ] User can create/edit a brand kit (logo + palette + rules)
- [ ] User can generate a poster with brand kit applied
- [ ] Generated images are stored in Convex (persist across sessions)
- [ ] User can view generation history and re-download
- [ ] Template browser shows system templates (view-only for now)
- [ ] All Convex mutations reject unauthenticated requests
- [ ] `bun run build` passes clean

---

## Phase 2 Preview — Template Editor + Multi-size Export

Phase 2 starts after Phase 1 Definition of Done is met. Key deliverables:

1. **Canvas-based template editor** (`/templates/[id]/edit`)
   - Select/move/resize layers
   - Edit text inline (Arabic RTL)
   - Replace images via file picker
   - "Apply brand kit colors" button
   - Layer panel with visibility toggles

2. **Server-side export pipeline**
   - `sharp` + `@napi-rs/canvas` (or Satori/Resvg fallback for Arabic)
   - Render template layers → composite → export PNG at requested size
   - Multi-size: same template → export at 1:1, 9:16, 4:5, 16:9

3. **Template forking**
   - Clone system template → edit → save as custom
   - Track parent version for "update available" badge

4. **Key risk to spike early:** Arabic text rendering with `@napi-rs/canvas`
   - Test before committing to the approach
   - Fallback: Satori (SVG) + Resvg (PNG) — known to handle Arabic

---

## File Inventory (what exists after backend foundation)

### Convex functions
```
convex/
├── schema.ts           # 7 tables: users, organizations, brand_kits, templates, generations, credits_ledger, audit_logs
├── generations.ts      # create, updateStatus, updateOutput, get, listByOrg, listByUser, countActive, generateUploadUrl
├── brandKits.ts        # save, update, remove, get, getDefault, listByOrg, setStyleSeed
├── templates.ts        # create, update, fork, remove, get, listSystem, listByOrg
├── credits.ts          # debit, credit, refundGeneration, getBalance, getLedger
├── organizations.ts    # create, get, getBySlug, updatePlan, getPlanLimits
├── users.ts            # getOrCreate, getByClerkId, get, listByOrg, updateRole
└── auditLogs.ts        # write, listByOrg
```

### Lib modules
```
lib/
├── types.ts            # All TypeScript types (BrandKit, TemplateLayer, PlanLimits, OutputFormat, etc.)
├── validation.ts       # Zod v4 schemas (form data, brand kit, images)
├── prompts.ts          # System prompts + brand kit injection + negative prompts + style seed
├── constants.ts        # FORMAT_CONFIGS (6), AI_GENERATION_FORMATS (3), template categories, style adjectives, plan limits
├── ai.ts               # AI Gateway setup
└── image-compression.ts # Client-side image compression
```

### Pending creation
```
# Auth (Task 1)
convex/auth.config.ts
middleware.ts
app/sign-in/[[...sign-in]]/page.tsx
app/sign-up/[[...sign-up]]/page.tsx
lib/auth.ts

# Pages (Tasks 2-4)
app/brand-kit/page.tsx
app/brand-kit/brand-kit-form.tsx
app/history/page.tsx
app/history/generation-card.tsx
app/templates/page.tsx
app/templates/template-card.tsx

# Supporting (Tasks 5-6)
lib/brand-extraction.ts
convex/seedTemplates.ts
```

---

## Recommended Task Order

```
Task 1 (Auth)           ←── do first, everything depends on it
    ↓
Task 5 (Storage)        ←── can be done in parallel with Task 2
Task 2 (Brand Kit)
    ↓
Task 6 (Connect brand kit to generation)
    ↓
Task 3 (History)
Task 4 (Templates)      ←── can be done in parallel with Task 3
```

Tasks 3 and 4 are independent and can be built in parallel. Tasks 5 and 2 can also be parallelized since they touch different files.
