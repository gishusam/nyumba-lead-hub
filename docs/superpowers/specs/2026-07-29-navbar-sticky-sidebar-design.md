# Full-width top bar and sticky sidebar

## Goal

Make the application shell feel deliberate and reliable across desktop and mobile without changing page-specific content or introducing placeholder features.

## Approved UX direction

- Use the full available width of the main application column for the top bar.
- Let global search grow into the available space instead of capping it at a fixed maximum width.
- Remove the global **Refresh Data** action. Query-backed pages already own their loading lifecycle, while invalidating every query is too broad and gives the user no useful success or failure feedback.
- Remove the decorative notification bell and unread dot because the product has no notification destination or notification data.
- Keep signed-in identity and logout as the only account controls. Preserve a clear logout action on desktop and compact the account presentation at narrow widths.
- Make search results actionable. Selecting a lead routes the user into the lead workflow rather than leaving the dropdown open as a dead end.

## Layout behavior

### Desktop

- The top bar remains at the top of the main content column and spans that column edge to edge.
- The search field is flexible and receives the remaining horizontal space.
- Account controls retain intrinsic width and do not compress the search below a usable size.
- The sidebar remains fixed to the left application column and sticks to the viewport while page content scrolls.
- If the sidebar contents ever exceed the viewport, only the sidebar navigation area scrolls; the page layout must not develop a second horizontal scrollbar.

### Mobile and narrow tablet

- The persistent desktop sidebar must not occupy layout width. Navigation uses the existing responsive/mobile behavior.
- The top bar reduces horizontal padding and hides non-essential account text before controls collide.
- Search remains the primary top-bar control and stays keyboard accessible.

## Interaction and accessibility

- Search retains debounce behavior, loading and empty states, and click-outside dismissal.
- Search results use real interactive elements with keyboard focus, visible hover/focus states, and deterministic navigation.
- Logout remains a labelled action with an accessible name at every viewport.
- Removed controls leave no empty separators or unexplained status indicators.

## Implementation boundaries

- Limit shell changes to `TopBar`, `AppSidebar`, and the app layout unless a small supporting change is required for route-safe search navigation.
- Do not change dashboard cards, scraper functionality, lead data contracts, authentication contracts, or page-specific filters.
- Reuse the existing design system and Tailwind utilities.

## Verification

- Run the production build and the smallest relevant lint/type checks available in the repository.
- In a real browser, verify Dashboard, Data Scraper, Apartments, and at least one additional route.
- On desktop, scroll long pages and confirm the sidebar stays pinned without clipping or overlapping the top bar.
- On a narrow mobile viewport, confirm navigation and top-bar controls remain usable with no horizontal overflow.
- Exercise global search, a selected result, and logout affordance without signing out of the test session.
- Capture review-ready desktop and mobile screenshots under `docs/assets/pr-navbar-sticky-sidebar/`.

## Delivery

- Work on the informal branch `navbar-sticky-sidebar`.
- Stage only files belonging to this task; preserve the pre-existing untracked mockup and scraper documents.
- Push the branch and open a PR only after browser proof and scoped verification pass.
