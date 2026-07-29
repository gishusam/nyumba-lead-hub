# Navbar and Sticky Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a full-width, purposeful top bar and a viewport-sticky desktop sidebar with a usable mobile navigation path.

**Architecture:** Keep the application shell responsible for global navigation and account actions. Refactor the sidebar's route list into one reusable navigation body for desktop and a Radix Sheet on mobile, while the top bar owns the mobile trigger and global lead-search detail flow.

**Tech Stack:** React 19, TypeScript, TanStack Router, TanStack Query, Tailwind CSS 4, Radix Sheet, Lucide icons, agent-browser.

---

## File map

- Modify `src/components/AppSidebar.tsx`: share navigation markup, add sticky desktop geometry, and expose mobile sheet navigation.
- Modify `src/components/TopBar.tsx`: remove unsupported controls, make search fluid and actionable, add responsive mobile navigation, and retain accessible account/logout behavior.
- Modify `memory.md`: record the implemented shell behavior and verification evidence.
- Create `docs/assets/pr-navbar-sticky-sidebar/navbar-sticky-sidebar-desktop.png`: desktop PR proof.
- Create `docs/assets/pr-navbar-sticky-sidebar/navbar-sticky-sidebar-mobile.png`: mobile PR proof.

### Task 1: Make navigation persistent on desktop and reachable on mobile

**Files:**

- Modify: `src/components/AppSidebar.tsx`

- [ ] **Step 1: Record the failing browser assertions**

At `1440x900`, open `/scrape`, scroll the document, and confirm the sidebar top currently leaves the viewport. At `390x844`, open `/` and confirm there is no navigation trigger. Save these observations in the browser QA notes for comparison after implementation.

- [ ] **Step 2: Refactor one reusable navigation body**

Create a private `SidebarNavigation` component that owns the brand block, the mapped route links, and the pipeline tip. Give it an optional `onNavigate` callback and invoke that callback from every route link so a mobile sheet can close after navigation.

```tsx
function SidebarNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* existing brand block */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <Link key={item.to} to={item.to} onClick={onNavigate}>
            {/* existing icon, label, and active-state classes */}
          </Link>
        ))}
      </nav>
      {/* existing pipeline tip */}
    </div>
  );
}
```

- [ ] **Step 3: Apply safe desktop sticky geometry**

Keep the desktop sidebar hidden below `md`, and constrain it to the viewport without applying fixed positioning.

```tsx
export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 self-start overflow-hidden border-r border-sidebar-border bg-sidebar md:block">
      <SidebarNavigation />
    </aside>
  );
}
```

- [ ] **Step 4: Add a controlled mobile sheet**

Export a `MobileSidebar` component that uses the existing `Sheet`, `SheetContent`, and `SheetTrigger` primitives. Use an icon-only menu button with `aria-label="Open navigation"`, hide it from `md` upward, and close the sheet through `onNavigate`.

```tsx
export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SidebarNavigation onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 5: Run the first verification gate**

Run `npm run build`.

Expected: exit code `0` with a successful Vite production build.

- [ ] **Step 6: Commit the navigation unit**

```powershell
git add -- src/components/AppSidebar.tsx
git commit -m "feat(shell): add responsive sticky navigation"
```

### Task 2: Streamline and complete the top-bar interactions

**Files:**

- Modify: `src/components/TopBar.tsx`

- [ ] **Step 1: Remove unsupported global actions**

Delete `Bell`, `RefreshCw`, and `useQueryClient` imports, `handleRefresh`, the global refresh button, the notification button, and the separator left behind by those controls.

- [ ] **Step 2: Make the header and search consume available width**

Use a full-width, responsive header and remove the search cap.

```tsx
<header className="flex h-16 w-full shrink-0 items-center gap-2 border-b border-border bg-card/60 px-3 backdrop-blur sm:gap-3 sm:px-6">
  <MobileSidebar />
  <div className="relative min-w-0 flex-1" ref={ref}>
    {/* existing search input and result surface */}
  </div>
</header>
```

Keep the search input at least 44 pixels high on touch layouts and truncate the placeholder naturally instead of allowing horizontal overflow.

- [ ] **Step 3: Make global search results open the existing lead workflow**

Add `activeLead` state typed as `Lead | null`, render each result as a real button, and select it through one handler.

```tsx
const [activeLead, setActiveLead] = useState<Lead | null>(null);

const handleSelectResult = (lead: Lead) => {
  setActiveLead(lead);
  setOpen(false);
  setQ("");
};

<button
  type="button"
  key={result.id}
  onClick={() => handleSelectResult(result)}
  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
>
  {/* existing result content */}
</button>

<LeadDetailPanel lead={activeLead} onClose={() => setActiveLead(null)} />
```

This uses the existing `LeadDetailPanel` instead of adding a new route or duplicating lead details.

- [ ] **Step 4: Make account controls responsive and explicit**

Keep the avatar, show name and role only at `lg` and wider, and retain the logout icon as a button with both `title="Sign out"` and `aria-label="Sign out"`. Use a compact left divider only where space permits.

- [ ] **Step 5: Verify code quality**

Run:

```powershell
npx eslint src/components/TopBar.tsx src/components/AppSidebar.tsx --rule "prettier/prettier: off"
npm run build
```

Expected: both commands exit `0`.

- [ ] **Step 6: Commit the top-bar unit**

```powershell
git add -- src/components/TopBar.tsx
git commit -m "feat(shell): streamline the global top bar"
```

### Task 3: Prove the user-visible workflow and prepare delivery

**Files:**

- Modify: `memory.md`
- Create: `docs/assets/pr-navbar-sticky-sidebar/navbar-sticky-sidebar-desktop.png`
- Create: `docs/assets/pr-navbar-sticky-sidebar/navbar-sticky-sidebar-mobile.png`

- [ ] **Step 1: Load the installed browser workflow**

Run:

```powershell
agent-browser skills get core
agent-browser skills get dogfood
```

Use a production preview or equivalent local server backed by real authenticated data. Do not treat a successful server start as proof.

- [ ] **Step 2: Verify the desktop route matrix**

At `1440x900`, visit Dashboard, Data Scraper, Apartments, and My Leads. On each route:

- confirm the top bar spans the complete main column;
- confirm no refresh or notification controls remain;
- confirm active navigation is correct;
- scroll enough to prove the sidebar brand and navigation stay in place;
- inspect for horizontal overflow, clipping, overlap, and console errors.

- [ ] **Step 3: Exercise global search**

Search for a real lead, wait for populated results, select one, and confirm the existing lead detail panel opens with the selected lead. Close the panel, focus search again, and confirm the interaction remains usable.

- [ ] **Step 4: Verify the mobile route matrix**

At `390x844`, visit Dashboard and Apartments. Confirm:

- no horizontal page overflow;
- the search and account/logout affordances remain reachable;
- the navigation trigger opens the left sheet;
- choosing a route closes the sheet and updates the active route;
- no desktop sidebar width remains reserved.

- [ ] **Step 5: Capture committed proof**

Capture:

- `docs/assets/pr-navbar-sticky-sidebar/navbar-sticky-sidebar-desktop.png` on Dashboard after scrolling enough to demonstrate the sticky sidebar;
- `docs/assets/pr-navbar-sticky-sidebar/navbar-sticky-sidebar-mobile.png` with the navigation sheet open.

- [ ] **Step 6: Update the repository memory receipt**

Append the implemented shell behavior, exact verification commands, route/viewport coverage, and proof paths to the `2026-07-29 - Application shell UX direction` section in `memory.md`.

- [ ] **Step 7: Final scoped verification and commit**

Run:

```powershell
git diff --check
git status --short
git diff -- src/components/TopBar.tsx src/components/AppSidebar.tsx memory.md
```

Stage only the two screenshots and `memory.md`, then commit:

```powershell
git add -- docs/assets/pr-navbar-sticky-sidebar/navbar-sticky-sidebar-desktop.png docs/assets/pr-navbar-sticky-sidebar/navbar-sticky-sidebar-mobile.png memory.md
git commit -m "docs(shell): add responsive navigation proof"
```

- [ ] **Step 8: Push and open the PR**

Push `navbar-sticky-sidebar`, open a PR against `main`, include the verification commands and both proof images, then verify the remote branch, PR URL, and live CI state before reporting completion.
