# Frontend Agent Prompt: Build Admin Dashboard UI

You are implementing the frontend/admin layer for this project.

## Goal

Build production-ready admin pages and UI wiring for:

1. AI analytics dashboard
2. Finance/profit dashboard
3. Users page
4. Subscriptions page
5. Support tickets page
6. Feedback page (likes/dislikes)
7. Likes/dislikes controls inside preview modal

## Context

- Stack: Next.js App Router + React + Supabase.
- Backend APIs and schema are already implemented in Supabase.
- Keep current design language (do not redesign the whole app theme).
- Keep responsive behavior for desktop and mobile.

## Required Routes

Create these pages:

- `/admin`
- `/admin/ai`
- `/admin/finance`
- `/admin/users`
- `/admin/subscriptions`
- `/admin/support`
- `/admin/feedback`

Use an admin layout/sidebar shared across admin pages.

## Required Supabase APIs (already available)

Queries:

- `api.admin.getAiOverview({ periodDays? })`
- `api.admin.getDailyUsage({ periodDays? })`
- `api.admin.getFinancialOverview({ periodDays? })`
- `api.admin.listUsers({ limit? })`
- `api.admin.listSubscriptions({})`
- `api.admin.listSupportTickets({ status?, limit? })`
- `api.admin.getSupportTicketThread({ ticketId })`
- `api.admin.listFeedback({ rating?, limit? })`
- `api.admin.getFeedbackSummary({})`

Mutations:

- `api.admin.submitFeedback({ rating, comment?, model?, category?, generationId?, imageStorageId? })`
- `api.admin.createSupportTicket({ subject, body, priority? })`
- `api.admin.replySupportTicket({ ticketId, body, newStatus? })`
- `api.admin.updateTicketStatus({ ticketId, status })`
- `api.admin.assignTicket({ ticketId, assignedTo })`

## UI Requirements by Page

### `/admin/ai`

- KPI cards:
  - total requests
  - success rate
  - total AI cost
  - total images generated
- Model usage table (grouped by model with count, cost, avg duration).
- Daily usage chart from `getDailyUsage`.
- Explain model strategy:
  - paid: `gemini-3-pro-image-preview`
  - free: `gemini-2.5-flash-image`

### `/admin/finance`

- Show formula clearly:
  - `Profit = Revenue - Stripe Fees - API Usage Cost`
- Show values from `getFinancialOverview`.
- Add explanatory text under each metric:
  - Revenue source
  - Fee estimate logic
  - API cost source
- Include subscription distribution and MRR estimate.

### `/admin/users`

- Table with:
  - name/email/role
  - plan + billing status
  - monthly credit usage
  - addon balance
  - total generations
  - total AI cost

### `/admin/subscriptions`

- Summary cards:
  - total
  - active
  - trialing
  - past due
  - canceled
- Detailed list with user info and plan details.

### `/admin/support`

- Ticket list with filters by status.
- Ticket detail panel/thread view.
- Reply box for admin replies.
- Status controls and assignment control.

### `/admin/feedback`

- Summary cards:
  - total
  - likes
  - dislikes
  - like rate
- Filterable table/list (all, like, dislike).
- Include user info, model, category, timestamp, comment.

## Modal Feedback Integration

Update preview modal component:

- File: `app/components/poster-modal.tsx`
- Add thumbs up and thumbs down actions.
- On click, optionally open small textarea for reason/comment.
- Submit via `api.admin.submitFeedback`.
- Include available metadata:
  - rating
  - model (if known)
  - category (if known)
  - generationId / imageStorageId when available

## Access Control

- Admin pages should fail gracefully when user is not admin.
- Show clear unauthorized state UI.
- Do not expose raw backend errors to end users.

## Engineering Constraints

- Use existing components/styles/tokens where possible.
- Add loading, empty, and error states on each page.
- Avoid `any`; keep TypeScript strict.
- Keep files modular and reusable.

## Deliverables

1. Admin layout + all listed routes.
2. Full data wiring to Supabase admin APIs.
3. Preview modal feedback controls connected to backend mutation.
4. Basic QA checklist in PR description:
   - desktop/mobile checks
   - loading/empty/error states
   - permission checks
   - core metric rendering

