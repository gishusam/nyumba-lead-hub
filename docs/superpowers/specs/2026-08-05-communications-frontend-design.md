# Nyumba Zetu Communications Frontend Design

**Date:** 2026-08-05  
**Repository:** `gishusam/nyumba-lead-hub`  
**Feature branch:** `feature/communications-frontend`  
**Integration branch:** `staging`  
**Backend branch:** `gishusam/sales_intelligence:feature/communications-foundation`

## Objective

Build a production-quality Communications workspace inside the existing Nyumba Zetu Lead Intelligence frontend. The frontend will consume the completed Communications backend contracts while preserving the current authenticated shell, design system, API conventions, and role model.

Nothing is merged into `main`, deployed, or connected to the production database during frontend implementation.

## Branching model

```text
main
└── staging
    └── feature/communications-frontend
```

The backend follows the equivalent structure:

```text
main
└── staging
    └── feature/communications-foundation
```

Completed frontend slices merge into frontend `staging`. Full frontend-backend integration is tested in staging before either staging branch is merged into `main`.

## Existing frontend foundation

The existing repository already provides:

- React 19
- TanStack Start and file-based TanStack Router
- TanStack React Query
- Tailwind CSS
- Radix UI components
- Lucide icons
- Recharts
- React Hook Form
- Zod
- Authenticated application layout
- Shared sidebar and top bar
- Bearer-token API client
- `VITE_API_BASE_URL` configuration

No new frontend framework or state-management system will be introduced.

## Local integration

```text
Frontend
feature/communications-frontend
http://localhost:5173
        |
        | Bearer-authenticated JSON API
        v
Backend
feature/communications-foundation
http://localhost:8000
```

Local frontend environment:

```env
VITE_API_BASE_URL=http://localhost:8000
```

This override is required because the default API URL points to the currently deployed backend, which does not yet contain the Communications feature branch.

## Information architecture

The global sidebar gains one primary entry:

- Communications

The Communications workspace contains:

1. Overview
2. Cold Outreach
3. Follow-ups
4. Newsletters
5. Templates
6. Automations
7. Sender Settings

Provider events, message history, readiness, and diagnostics are surfaced inside the relevant workflows rather than becoming extra top-level sections.

## Architecture

```text
Route
→ React Query hook
→ Communications API module
→ Existing authenticated request client
→ FastAPI Communications endpoint
→ Typed response
→ View model
→ UI component
```

Mutations follow:

```text
Form
→ Zod/form validation
→ API mutation
→ Backend validation
→ User feedback
→ Targeted query invalidation
→ Fresh server state
```

The backend remains the source of truth for authorization, lifecycle transitions, suppression, readiness, and delivery state.

## Shared Communications API module

A dedicated module will own:

- TypeScript request and response contracts
- Overview requests
- Readiness requests
- Template requests
- Sender identity requests
- Message preview, test-send, send, and history requests
- Campaign and lifecycle requests
- Automation requests
- Newsletter and delivery requests
- Provider event requests
- News-source and AI-assisted drafting requests

Components must not call `fetch` directly.

## Communications shell

The shell owns:

- Workspace heading and description
- Section navigation
- Responsive desktop/mobile behavior
- Shared permission messaging
- Consistent width and spacing
- Nested route rendering

The shell does not own workflow data.

## Overview

The first vertical slice displays real backend data:

- Delivery and engagement metrics
- Campaign lifecycle summaries
- Newsletter summaries
- Message-status distribution
- Recent provider activity
- Readiness state
- Calls to action into workflow pages

The page includes explicit loading, empty, degraded, unauthorized, and backend-error states.

## Templates and sender identities

Templates support:

- Listing and filtering
- Creating and updating
- Required placeholder guidance
- Active/inactive state
- Rendered preview

Sender identities support:

- Listing
- Creating and updating
- Default selection
- Active/inactive state
- Provider and reply-to details

Mutation controls are shown only to permitted roles.

## Manual outreach

The manual message workflow supports:

- Selecting a lead
- Selecting a template and sender
- Previewing personalized content
- Approved overrides
- Test send
- Idempotent send
- Optional follow-up date
- Message history and delivery status
- Suppression and staging allow-list errors

## Campaigns and follow-ups

Campaigns support:

- Draft creation
- Ordered steps
- Lead enrolment
- Preflight
- Scheduling
- Pause, resume, and cancellation
- Recipient progress
- Delivery failures

Follow-ups reuse campaign and message primitives where practical.

## Automations

Automations support:

- Rule listing
- Rule creation and editing
- Active/inactive state
- Template and sender selection
- Inactivity thresholds
- Draft limits
- Execution history
- Authorized worker controls

Generated messages remain reviewable drafts unless the backend explicitly permits another lifecycle.

## Newsletters and news drafting

Newsletter workflows support:

- Structured block editing
- Required unsubscribe link
- Audience selection
- Review and approval
- Test send
- Scheduling and cancellation
- Recipient delivery states

News drafting supports:

- Source management
- Article ingestion
- Article selection
- AI-assisted draft generation
- Provenance
- Mandatory human review before delivery

## Permissions

Frontend role handling improves usability but does not replace backend authorization.

- Sales users see permitted read and outreach workflows.
- Managers and administrators see permitted configuration and lifecycle controls.
- Unauthorized actions display a clear permission message.
- Hidden controls are not treated as a security boundary.
- The UI never claims success when the backend rejects an operation.

## Error handling

Screens distinguish:

- Initial loading
- Empty result
- Validation failure
- Authentication expiry
- Permission denial
- Invalid lifecycle transition
- Suppressed recipient
- Staging allow-list rejection
- Request timeout
- Backend unavailable
- Partial readiness

Destructive lifecycle operations require confirmation.

## Visual direction

The Communications workspace extends the current Nyumba Zetu design system:

- Existing typography and colors
- Existing sidebar and top bar
- Dense but readable operational layouts
- Clear status badges
- Responsive cards and tables
- Accessible labels and focus states
- Skeletons that preserve layout
- No unrelated redesign

Functionality and clarity take priority over novelty.

## Testing strategy

Focused tests will cover:

- API contracts
- Permission-dependent controls
- Loading, empty, and error states
- Form validation
- Lifecycle actions and badges
- Authentication headers
- API base override
- Query invalidation
- Core browser workflows
- Desktop and mobile visual checks

The project will avoid excessive tests for purely presentational details.

## Implementation slices

### Slice 1 — Vertical integration foundation

- Communications API types and client
- Sidebar entry
- Communications shell
- Live Overview
- Readiness display
- Loading, empty, permission, and error states
- Build and browser verification

### Slice 2 — Templates and sender identities

- Template management
- Sender settings
- Validation and role controls

### Slice 3 — Manual outreach

- Lead selection
- Preview
- Test send
- Send
- Message history

### Slice 4 — Campaigns and follow-ups

- Campaign builder
- Steps
- Audience enrolment
- Preflight and scheduling
- Lifecycle controls
- Recipient progress

### Slice 5 — Automations

- Rule management
- Execution history
- Draft review
- Authorized worker controls

### Slice 6 — Newsletters

- Structured editor
- Audience
- Review and approval
- Test delivery
- Scheduling and recipient state

### Slice 7 — News sources and AI drafting

- Source management
- Article ingestion
- Selection
- AI generation
- Provenance and review

### Slice 8 — End-to-end hardening

- Cross-workflow browser tests
- Responsive visual review
- Accessibility pass
- Error-state review
- Staging checklist
- PR evidence

## Slice 1 acceptance criteria

Slice 1 is complete when:

- `/communications` is reachable from desktop and mobile navigation.
- The frontend uses the local backend through `VITE_API_BASE_URL`.
- Authenticated Overview and readiness requests succeed.
- Real backend data renders without production mocks.
- Loading, empty, unauthorized, and server-error states are clear.
- Unauthorized roles do not see manager/admin mutation controls.
- The production frontend build succeeds.
- Existing application routes continue to work.
- Desktop and mobile checks show no overlap, clipping, or broken navigation.
- Nothing is merged into `main` or deployed.
