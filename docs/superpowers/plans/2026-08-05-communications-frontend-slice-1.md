# Communications Frontend Slice 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working Communications frontend slice: local backend connectivity, typed Communications API access, navigation, workspace shell, live Overview, readiness, and recent provider activity.

**Architecture:** Extend the existing authenticated TanStack Start application without replacing its shell or API conventions. A dedicated Communications API factory consumes the shared authenticated request function, pure view-model helpers convert backend aggregates into UI-ready data, and file-based routes render a responsive Communications workspace through React Query.

**Tech Stack:** Node.js 22, React 19, TypeScript 5.8, TanStack Start/Router, TanStack React Query, Tailwind CSS 4, Radix UI, Lucide React, Vitest.

## Global Constraints
> **Test-runner compatibility:** The repository already contains `node:test` suites named `*.test.ts`. Slice 1 preserves those tests under Node's runner and reserves `*.vitest.ts` for new Vitest suites. `npm test` runs both runners sequentially.


- Work only on `feature/communications-frontend`.
- Base integration branch is `staging`; do not modify `main`.
- Local backend is `gishusam/sales_intelligence:feature/communications-foundation` at `http://localhost:8000`.
- Local frontend must use `VITE_API_BASE_URL=http://localhost:8000`.
- Do not deploy the frontend or backend.
- Do not apply the Communications migration to production.
- Reuse the existing application shell, design tokens, authenticated request behavior, React Query, and TanStack Router.
- Do not add another state-management library or UI framework.
- Keep tests focused on contracts and state derivation; verify layout and interaction in the browser.
- Desktop and mobile checks must show no overlap, clipping, or horizontal overflow.

---

## File Structure

### Runtime and tests

- Create: `.node-version`
- Modify: `package.json`
- Create/update: `package-lock.json`
- Create: `src/lib/test-runtime.vitest.ts`

### API boundary

- Modify: `src/lib/api.ts`
- Create: `src/lib/communications-api.ts`
- Create: `src/lib/communications-api.test.ts`

### Feature model and UI

- Create: `src/features/communications/overview-model.ts`
- Create: `src/features/communications/overview-model.test.ts`
- Create: `src/features/communications/communications-navigation.ts`
- Create: `src/features/communications/CommunicationsShell.tsx`
- Create: `src/features/communications/CommunicationsOverview.tsx`
- Create: `src/features/communications/OverviewSkeleton.tsx`
- Create: `src/features/communications/OverviewError.tsx`

### Routes and global navigation

- Modify: `src/components/AppSidebar.tsx`
- Create: `src/routes/_app.communications.tsx`
- Create: `src/routes/_app.communications.index.tsx`
- Generated: `src/routeTree.gen.ts`

### Local setup and evidence

- Create: `.env.example`
- Create: `docs/communications/FRONTEND_SLICE_1_VERIFICATION.md`
- Create: `docs/assets/communications-slice-1/overview-desktop.png`
- Create: `docs/assets/communications-slice-1/overview-mobile.png`

---

### Task 1: Establish the supported runtime and focused test harness

**Files:**
- Create: `.node-version`
- Modify: `package.json`
- Create/update: `package-lock.json`
- Create: `src/lib/test-runtime.vitest.ts`

**Interfaces:**
- Consumes: existing npm/Vite project.
- Produces: Node 22 project pin, `npm run typecheck`, `npm test`, and `npm run test:watch`.

- [ ] **Step 1: Confirm Node 22 is active**

Run:

```bash
node --version
```

Expected: `v22.x.x`.

- [ ] **Step 2: Pin the repository runtime**

Create `.node-version`:

```text
22
```

- [ ] **Step 3: Add scripts before installing the test runner**

Add to the `scripts` object in `package.json`:

```json
"typecheck": "tsc --noEmit",
"test": "npm run test:node && npm run test:vitest",
"test:node": "node --test src/lib/*.test.ts",
"test:vitest": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify the new test command fails for the expected reason**

Run:

```bash
npm test
```

Expected: FAIL because `vitest` is not installed.

- [ ] **Step 5: Install Vitest and generate the lock file under Node 22**

Run:

```bash
npm install --save-dev vitest
```

Expected: `vitest` appears in `devDependencies` and `package-lock.json` is generated.

- [ ] **Step 6: Add the minimal runtime smoke test**

Create `src/lib/test-runtime.vitest.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("frontend test runtime", () => {
  it("runs TypeScript tests", () => {
    expect(22).toBe(22);
  });
});
```

- [ ] **Step 7: Verify the runtime**

Run:

```bash
npm test
npm run typecheck
```

Expected: the smoke test passes and TypeScript exits 0.

- [ ] **Step 8: Commit**

```bash
git add .node-version package.json package-lock.json src/lib/test-runtime.vitest.ts
git commit -m "chore: establish communications frontend runtime"
```

---

### Task 2: Expose the shared requester and implement the Communications API client

**Files:**
- Modify: `src/lib/api.ts`
- Create: `src/lib/communications-api.ts`
- Create: `src/lib/communications-api.test.ts`

**Interfaces:**
- Consumes: `apiRequest<T>(path, init)` from `src/lib/api.ts`.
- Produces: `communicationsApi.overview()`, `communicationsApi.readiness()`, and `communicationsApi.events({ limit })`.

- [ ] **Step 1: Write the failing API contract test**

Create `src/lib/communications-api.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createCommunicationsApi } from "./communications-api";

describe("communicationsApi", () => {
  it("uses the authenticated overview and readiness endpoints", async () => {
    const requester = vi.fn().mockResolvedValue({});
    const api = createCommunicationsApi(requester);

    await api.overview();
    await api.readiness();

    expect(requester).toHaveBeenNthCalledWith(
      1,
      "/api/communications/overview",
    );
    expect(requester).toHaveBeenNthCalledWith(
      2,
      "/api/communications/readiness",
    );
  });

  it("serializes the provider event limit", async () => {
    const requester = vi.fn().mockResolvedValue([]);
    const api = createCommunicationsApi(requester);

    await api.events({ limit: 8 });

    expect(requester).toHaveBeenCalledWith(
      "/api/communications/events?limit=8",
    );
  });
});
```

- [ ] **Step 2: Verify RED**

```bash
npm test -- src/lib/communications-api.test.ts
```

Expected: FAIL because `communications-api.ts` does not exist.

- [ ] **Step 3: Export the existing requester without rewriting current callers**

In `src/lib/api.ts`, change:

```ts
async function request<T>(
```

to:

```ts
export async function apiRequest<T>(
```

After the function, add:

```ts
const request = apiRequest;
```

Do not replace all existing `request(...)` calls.

- [ ] **Step 4: Create exact Slice 1 backend types and endpoint functions**

Create `src/lib/communications-api.ts`:

```ts
import { apiRequest } from "@/lib/api";

export type CommunicationsOverview = {
  total_messages: number;
  queued_messages: number;
  processing_messages: number;
  sent_messages: number;
  delivered_messages: number;
  failed_messages: number;
  dead_letter_messages: number;
  bounced_messages: number;
  complained_messages: number;
  unsubscribed_messages: number;
  opens: number;
  clicks: number;
  active_campaigns: number;
  active_newsletters: number;
  suppressed_contacts: number;
};

export type CommunicationsSchemaAudit = {
  ready: boolean;
  missing_tables: string[];
  missing_columns: string[];
  missing_indexes: string[];
  mismatched_constraints: string[];
  error?: string;
};

export type CommunicationsReadiness = {
  ready: boolean;
  environment: string;
  issues: string[];
  schema: CommunicationsSchemaAudit;
  checked_at: string;
};

export type ProviderEvent = {
  id: number;
  provider: string;
  provider_event_id: string;
  email_message_id: number | null;
  provider_message_id: string;
  event_type:
    | "delivered"
    | "hard_bounce"
    | "soft_bounce"
    | "complaint"
    | "unsubscribe"
    | "opened"
    | "clicked";
  recipient_email: string | null;
  bounce_type: "hard" | "soft" | null;
  reason: string | null;
  url: string | null;
  occurred_at: string;
  signature_verified: boolean;
  status: string;
  created_at: string;
};

export type ApiRequester = <T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
) => Promise<T>;

export function createCommunicationsApi(
  requester: ApiRequester = apiRequest,
) {
  return {
    overview: () =>
      requester<CommunicationsOverview>(
        "/api/communications/overview",
      ),
    readiness: () =>
      requester<CommunicationsReadiness>(
        "/api/communications/readiness",
      ),
    events: ({ limit = 8 }: { limit?: number } = {}) =>
      requester<ProviderEvent[]>(
        `/api/communications/events?limit=${limit}`,
      ),
  };
}

export const communicationsApi = createCommunicationsApi();
```

- [ ] **Step 5: Verify GREEN**

```bash
npm test -- src/lib/communications-api.test.ts
npm run typecheck
```

Expected: API tests pass and TypeScript exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api.ts src/lib/communications-api.ts src/lib/communications-api.test.ts
git commit -m "feat: add communications overview api client"
```

---

### Task 3: Build and test the pure Overview model

**Files:**
- Create: `src/features/communications/overview-model.ts`
- Create: `src/features/communications/overview-model.test.ts`

**Interfaces:**
- Consumes: `CommunicationsOverview` and `CommunicationsReadiness`.
- Produces: `buildOverviewViewModel(overview, readiness)` and `emptyOverview`.

- [ ] **Step 1: Write failing tests for rates and empty data**

Create `src/features/communications/overview-model.test.ts` with cases that verify:

- 72 delivered from 80 sent produces a 90% delivery rate.
- 36 opens from 72 delivered produces a 50% open rate.
- 9 clicks from 72 delivered produces a 12.5% click rate.
- Zero denominators return zero.
- Ready reports use `healthy`; issue-bearing reports use `degraded`.
- All-zero overview data sets `isEmpty` to true.

- [ ] **Step 2: Verify RED**

```bash
npm test -- src/features/communications/overview-model.test.ts
```

Expected: FAIL because the implementation does not exist.

- [ ] **Step 3: Implement `emptyOverview`, percentage calculations, metric cards, delivery statuses, readiness label, and empty-state flag**

The model must never divide by zero and must round percentages to one decimal place.

- [ ] **Step 4: Verify GREEN**

```bash
npm test -- src/features/communications/overview-model.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/features/communications/overview-model.ts src/features/communications/overview-model.test.ts
git commit -m "feat: model communications overview metrics"
```

---

### Task 4: Add global navigation and the responsive Communications shell

**Files:**
- Modify: `src/components/AppSidebar.tsx`
- Create: `src/features/communications/communications-navigation.ts`
- Create: `src/features/communications/CommunicationsShell.tsx`
- Create: `src/routes/_app.communications.tsx`
- Create: `src/routes/_app.communications.index.tsx`
- Generated: `src/routeTree.gen.ts`

**Interfaces:**
- Consumes: existing sidebar and TanStack Router.
- Produces: `/communications` parent route and Overview index route.

- [ ] **Step 1: Create the navigation contract**

```ts
export const communicationsNavigation = [
  { label: "Overview", to: "/communications", enabled: true },
  { label: "Cold Outreach", to: "/communications/outreach", enabled: false },
  { label: "Follow-ups", to: "/communications/follow-ups", enabled: false },
  { label: "Newsletters", to: "/communications/newsletters", enabled: false },
  { label: "Templates", to: "/communications/templates", enabled: false },
  { label: "Automations", to: "/communications/automations", enabled: false },
  { label: "Sender Settings", to: "/communications/senders", enabled: false },
] as const;
```

Future sections must be visibly disabled rather than linked to nonexistent routes.

- [ ] **Step 2: Add one global sidebar item**

Import `MessagesSquare` from `lucide-react` and insert after `My Leads`:

```ts
{ to: "/communications", label: "Communications", icon: MessagesSquare },
```

- [ ] **Step 3: Add the parent route**

Create `src/routes/_app.communications.tsx` with `createFileRoute("/_app/communications")`, metadata, and `CommunicationsShell`.

- [ ] **Step 4: Implement the shell**

The shell must:

- show the title `Communications`;
- show `Manage outreach, follow-ups, newsletters, and delivery health.`;
- render Overview as active;
- render future sections with `aria-disabled="true"`;
- render `<Outlet />`;
- keep the tab strip internally scrollable on narrow screens;
- avoid page-level horizontal overflow.

- [ ] **Step 5: Add the index placeholder and regenerate routes**

Create `src/routes/_app.communications.index.tsx`, then run:

```bash
npm run build
npm run typecheck
```

Expected: `src/routeTree.gen.ts` contains the Communications parent and index routes.

- [ ] **Step 6: Commit**

```bash
git add src/components/AppSidebar.tsx src/features/communications/communications-navigation.ts src/features/communications/CommunicationsShell.tsx src/routes/_app.communications.tsx src/routes/_app.communications.index.tsx src/routeTree.gen.ts
git commit -m "feat: add communications workspace shell"
```

---

### Task 5: Implement the live Overview and explicit states

**Files:**
- Create: `src/features/communications/CommunicationsOverview.tsx`
- Create: `src/features/communications/OverviewSkeleton.tsx`
- Create: `src/features/communications/OverviewError.tsx`
- Modify: `src/routes/_app.communications.index.tsx`

**Interfaces:**
- Consumes: `communicationsApi`, `buildOverviewViewModel`, React Query, and `getCurrentUser()`.
- Produces: complete live Overview route.

- [ ] **Step 1: Create stable loading and retryable error components**

`OverviewSkeleton` must use fixed-height card skeletons and `aria-label="Loading Communications overview"`.

`OverviewError` must accept:

```ts
type OverviewErrorProps = {
  title: string;
  message: string;
  onRetry: () => void;
};
```

- [ ] **Step 2: Add three queries**

```ts
const overviewQuery = useQuery({
  queryKey: ["communications", "overview"],
  queryFn: communicationsApi.overview,
});

const readinessQuery = useQuery({
  queryKey: ["communications", "readiness"],
  queryFn: communicationsApi.readiness,
});

const eventsQuery = useQuery({
  queryKey: ["communications", "events", 8],
  queryFn: () => communicationsApi.events({ limit: 8 }),
});
```

- [ ] **Step 3: Implement state rules**

- Core overview/readiness loading shows the skeleton.
- Core overview/readiness failure shows retryable error UI.
- Provider-event failure degrades only the activity panel.
- All-zero overview data is a valid empty operational state.
- Readiness issues remain visible and wrap safely.
- The UI never claims readiness when `readiness.ready` is false.

- [ ] **Step 4: Render the operational layout**

Render:

- five metric cards;
- delivery, open, and click rate cards;
- delivery-status counts and bounded bars;
- readiness environment, timestamp, schema state, and issues;
- eight recent provider events;
- empty event copy when no events exist.

Role behavior:

```ts
const canManage = ["admin", "manager"].includes(
  getCurrentUser()?.role ?? "",
);
```

Managers/admins see disabled future actions labelled `Create campaign` and `Create newsletter`. Sales users see configuration-access guidance. No future action is clickable in Slice 1.

- [ ] **Step 5: Replace the index placeholder and verify**

```bash
npm test
npm run typecheck
npm run build
```

Expected: tests pass; TypeScript exits 0; Vite client, SSR, and Nitro builds complete.

- [ ] **Step 6: Commit**

```bash
git add src/features/communications/CommunicationsOverview.tsx src/features/communications/OverviewSkeleton.tsx src/features/communications/OverviewError.tsx src/routes/_app.communications.index.tsx src/routeTree.gen.ts
git commit -m "feat: add live communications overview"
```

---

### Task 6: Document local integration and perform browser verification

**Files:**
- Create: `.env.example`
- Create: `docs/communications/FRONTEND_SLICE_1_VERIFICATION.md`
- Create: `docs/assets/communications-slice-1/overview-desktop.png`
- Create: `docs/assets/communications-slice-1/overview-mobile.png`

- [ ] **Step 1: Document the local API base**

Create `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Copy it locally:

```bash
cp .env.example .env.local
```

- [ ] **Step 2: Start and verify the backend feature branch**

Verify:

```bash
curl -i http://localhost:8000/health
```

Expected: HTTP 200.

Use only the local/test database or a disposable local PostgreSQL database. Do not apply the migration to production.

- [ ] **Step 3: Start the frontend**

```bash
npm run dev
```

- [ ] **Step 4: Desktop QA at 1440×900**

Verify:

- sign-in works;
- Communications appears after My Leads;
- `/communications` uses the feature backend;
- metrics, readiness, events, loading, empty, and error states render;
- stopping the backend produces retry UI;
- Dashboard, My Leads, and Settings still load;
- no unexpected console errors, failed requests, overlap, clipping, or horizontal overflow.

Capture `overview-desktop.png`.

- [ ] **Step 5: Mobile QA at 390×844**

Verify:

- mobile sidebar opens and closes;
- Communications is reachable;
- tabs scroll inside their region;
- cards stack without bleed;
- readiness issues wrap;
- event rows stay inside the viewport.

Capture `overview-mobile.png`.

- [ ] **Step 6: Record evidence truthfully**

Create `docs/communications/FRONTEND_SLICE_1_VERIFICATION.md` and record actual command/browser results. Do not write `passed` before verification.

- [ ] **Step 7: Final verification**

```bash
npm test
npm run typecheck
npm run build
git diff --check
git status --short
```

- [ ] **Step 8: Commit evidence and push**

```bash
git add .env.example docs/communications/FRONTEND_SLICE_1_VERIFICATION.md docs/assets/communications-slice-1/overview-desktop.png docs/assets/communications-slice-1/overview-mobile.png
git commit -m "docs: verify communications frontend slice 1"
git push
```

Do not merge into `staging` until Slice 1 code and evidence have been reviewed.

---

## Plan Self-Review

- Slice 1 API client, navigation, shell, live Overview, readiness, explicit states, permissions, build, and responsive QA are covered.
- Templates, senders, manual outreach, campaigns, automations, newsletters, and AI drafting remain outside this plan.
- API names and fields match the backend Overview, readiness, and provider-event contracts.
- No placeholders or unspecified implementation steps remain.
- No step merges `main`, deploys production, or applies a production migration.
