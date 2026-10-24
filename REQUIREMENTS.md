# ARROWSTACK Project 2 — implementation checklist

This checklist maps the Project 2 requirements supplied in the chat to the implementation; it is not represented as a verbatim PDF audit.

## Requirements baseline

### Stakeholder, decision, and measurable benefit

- **Primary stakeholder:** operations manager or team lead at a small-to-mid-sized organization.
- **Decision enabled:** decide which fulfillment exception to review first and whether order volume, revenue, and completion are improving over a chosen period.
- **Expected benefit:** reduce the effort required to find an exception and reconcile operational indicators by providing a single, filterable view.
- **Measurement:** usability target is to locate a delayed order and explain its status within 60 seconds. Record task completion time during a mentor walkthrough; do not claim a productivity improvement until observed with representative users.

### Problem definition

The stakeholder needs one reliable interface for scanning key performance indicators, identifying urgent orders, and comparing operational trends. NEXORA accepts a supported date range, order search, and status filter; retrieves simulated, validated records through mock REST endpoints; derives KPI summaries and chart/table data; and presents the results in accessible, responsive views and a filtered CSV export.

### Scope and constraints

- In scope: dashboard KPIs, alerts, daily revenue/order trends, date and status filters, validated search, sortable and paginated order tables, customer/operations/report views, loading/empty/error/success states, keyboard-accessible interactions, responsive layout, tests, and review evidence.
- Out of scope: live integrations, authentication/authorization, real personal or business data, persistent user settings, actual inventory control, and production alert delivery.
- Data must be generated, simulated, or otherwise authorized and public. This submission uses deterministic illustrative data only.
- Development browser requests are intercepted by MSW. The production preview serves the same simulated endpoint contract through Vite middleware so the development-only worker does not ship in the production client bundle. Neither is a production business backend.
- Calculations remain explicit and testable: cancelled orders do not contribute to revenue; all order statuses count toward order volume; completion rate is completed orders divided by all orders.
- Build and validation must be reproducible from the documented Node/npm commands. Lighthouse results are device/profile-specific measurements, not universal guarantees.

### Success measures

| Measure | Acceptance target | Evidence |
|---|---|---|
| Exception review | Find and identify a delayed order within 60 seconds in a timed mentor walkthrough | Dated walkthrough result; label as observed or not yet measured |
| Data integrity | Invalid mock records are rejected; KPI, trend, table, and export calculations follow the same documented rules | TypeScript checks and focused automated tests |
| Data-view states | Every data-driven view can present loading, empty, error/retry, and successful content | MSW scenario controls and browser smoke evidence |
| Filter correctness | Date range and status/search filters validate and consistently affect relevant views | Automated tests and browser checks |
| Accessibility | Primary flows work by keyboard, focus remains visible, controls are named, charts have text alternatives | Manual keyboard review and accessibility checks |
| Responsiveness | No document-level horizontal overflow at 320, 375, 768, 1024, and 1440 CSS px; tables may scroll within their own region | Browser viewport measurements |
| Performance | Paginated table, memoized derived data, route-level code splitting, and a recorded Lighthouse run | Build output and dated Lighthouse report/evidence |
| Reproducibility | Install, test, build, run and demo instructions work from a clean checkout | README commands and validation record |

### Acceptance checklist

- [x] Requirements, assumptions, constraints, and primary stakeholder are documented before implementation.
- [x] Dashboard includes KPI cards, alerts, accessible trend charts, validated filters, and a sortable/paginated order table.
- [x] Overview, Analytics, Orders, Customers, Operations, and Reports expose loading, empty, error/retry, and success states for their data.
- [x] MSW serves documented mock REST endpoints using generated data; no real/private records or credentials are used.
- [ ] Responsive component behavior is checked at mobile, tablet, and desktop widths.
- [ ] Keyboard navigation, visible focus, semantic landmarks, accessible names, chart alternatives, and contrast are reviewed.
- [x] Type checking, automated tests, production build, and browser smoke review are recorded with actual outcomes.
- [x] Performance work includes code splitting, memoized derivations, pagination, and a measured Lighthouse run; no score is claimed before measurement.
- [x] README, dated work log, decision log, test/validation evidence, demo script, limitations, and next-step roadmap are included.
- [x] The final review distinguishes observed evidence, assumptions, and limitations.

### Target project structure

```text
NEXORA/
  evidence/
    YYYY-MM-DD/
      work-log.md
      validation.md
      lighthouse.md
  public/
    mockServiceWorker.js
  src/
    api/
      dashboard-api.ts
    components/
      DataState.tsx
    mocks/
      browser.ts
      handlers.ts
    App.tsx
    data.ts
    main.tsx
    styles.css
    types.ts
    utils.ts
  DEMO_GUIDE.md
  README.md
  REQUIREMENTS.md
  index.html
  package.json
  tsconfig.json
  vite.config.ts
```

The structure is a target, not a claim that every directory already exists. Update it together with implementation evidence if the selected tooling requires a justified difference.

### Assumptions and source basis

- Requirement source: the Project 2 brief provided in this conversation. No separate internship specification was supplied in the workspace.
- Organization scale, task target, and workflow are scenario assumptions for this portfolio prototype, not findings from a stakeholder interview.
- The task-completion target is a proposed measurable acceptance threshold; baseline and improvement remain unmeasured until a timed walkthrough is recorded.
- The date of each work log and validation record is the actual execution date. Previously recorded 2026-10-23 checks are historical evidence and must not be relabelled as new results.

## Decision log

| Decision | Rationale | Trade-off / follow-up |
|---|---|---|
| React + TypeScript | Matches the requested recommended stack and makes data/API contracts explicit | Migration touches existing JavaScript and tests; retain focused steps and verify type safety |
| MSW in development; preview middleware in production preview | Provides realistic browser `fetch`/HTTP behavior and controllable response scenarios without shipping the development worker in the production client bundle | Production preview middleware is only for this demo; deployed data still requires a real API |
| Existing custom SVG charts retained | Existing charts have text alternatives and suit the small daily series without a runtime chart dependency | Not a general-purpose charting library; revisit if interactive/large-scale chart requirements grow |
| No real user or business data | Meets privacy and responsible-use requirements | Demo data cannot establish real operational outcomes |
| Development-only MSW runtime | Baseline Lighthouse Performance 75 / total transfer 225 KiB; optimized preview Performance 94 / transfer 144 KiB in the recorded mobile run | Single local Lighthouse run; repeat on target hosting and representative devices |

## Production-readiness roadmap

1. Replace demo endpoints with a versioned API contract, server-side filtering/pagination, and authenticated access.
2. Add role/permission modeling, privacy/data-retention rules, audit logging, and security review before connecting business records.
3. Add browser-level tests across current browsers, keyboard/screen-reader checks, and representative user timing studies.
4. Instrument web vitals, API latency/error rates, and task completion with consent and privacy safeguards; compare before/after against a measured baseline.
5. Establish chart, API, and component ownership/versioning policies before adding more operational workflows.

| Requirement area | Implementation evidence | Validation |
|---|---|---|
| Project identity, audience, simulated-data disclosure | NEXORA brand, operations workspace, demo-data labels, README scope and assumptions | Browser inspection of Overview and README |
| Design system and premium shell | Navy sidebar, restrained indigo/teal palette, DM Sans/Manrope, spacing and surface tokens, reusable panel/buttons | Visual review of 1440px desktop and 375px mobile Overview |
| Navigation and page coverage | Overview, Analytics, Orders, Customers, Operations, Reports, Settings each render useful content | All seven headings reached at desktop and 320px mobile |
| KPI integrity | Revenue excludes cancelled orders; orders count all statuses; unique active customers; completion rate and prior-period comparisons | Compare formulas in `src/App.tsx`, `src/data.ts`, `src/utils.ts`; generated records used across views |
| Client-side input and data validation | Supported date ranges/status values are allowlisted; API orders validate required fields, unique IDs, dates, amounts, and known statuses before state updates | `npm test`: validation edge cases, API invalid-range and malformed payload tests |
| Repeatable technical checks | Vitest covers period bounds, empty daily buckets, cancelled revenue, unique IDs, status counts, KPI summaries, percentage edge cases, CSV escaping, and REST scenarios | `npm test`: 14 tests |
| Analytics | Daily revenue and order charts, readable axes, SVG point tooltips, status donut, textual summaries | Overview values changed from 30-day `$209,571 / 89 orders` to 7-day `$51,087 / 20 orders`; 7-day trend labels and status breakdown rendered |
| Alerts and activity | Priority-coded alerts, matching order navigation, operations link, dismiss action, activity feed, notifications | Review action opened matching `NX-06365`; notification popover opened and closed with Escape |
| Orders table | Search, combined status filter, clear, sortable fields, eight-row pagination, filtered count, empty/loading states | Trimmed uppercase customer search returned 7, combined Delayed filter returned 3, no-result state shown, amounts sorted descending, next page reached |
| Date and search behavior | Shared range across data screens; case-insensitive trimmed search across order fields | Shared range changed to 7 days; checks ran on Overview and Orders |
| Export and refresh | UTF-8 CSV download of selected period and current filters; refresh refetches the validated mock REST contract and displays updated time | Historical CSV payload check in 2026-10-23 record; API loading/retry/data states tested in current 2026-10-24 record |
| Loading, empty, error, success | Shared request state for data-driven views; delayed loading, empty response, HTTP error/retry, and successful content | Empty, 503, and recovery scenarios explicitly exercised in browser; endpoint cases automated |
| Responsive behavior | Drawer, compact header date selector, two-column KPIs, stacked charts/rails, contained table overflow, narrow-screen styles | Overview checked at 320, 375, 768, 1024, and 1440 CSS px; all seven views checked at 320 and 375 px. Document width stayed within the available viewport; order tables scroll internally when necessary |
| Accessibility | Semantic regions/table, labels, focus visibility, status text, chart descriptions, reduced motion, skip link, `Ctrl+K` search | Drawer opened and Escape closed; focus returned to menu button. Notification popover closed on Escape/focus returned. Skip link focused main content; Ctrl+K focused global search |
| Documentation | Setup, project structure, formulas, assumptions, limitations, validation evidence | This file and README |

## Current validation evidence (2026-10-24)

Update these results only after running the named checks. “Not run” means there is no claim of success.

| Check | Result |
|---|---|
| `npm run typecheck` | Passed; zero TypeScript diagnostics |
| `npm test` | Passed; 14 tests, 0 failures |
| `npm run build` | Passed; strict typecheck and production build |
| `npm audit` | Passed; 0 vulnerabilities |
| Production REST scenarios | Passed; success (20 orders for 7 days), empty (0), error (503), invalid range (400) |
| Browser data states | Passed; loading, empty, error, recovery, and successful Overview content observed |
| Lighthouse | Mobile: Performance 94, Accessibility 95, Best Practices 96, SEO 91 |
| Responsive viewport sweep after TS/MSW migration | Not rerun; 2026-10-23 measurements are historical baseline only |
| Keyboard/screen-reader review after TS/MSW migration | Not fully rerun; previous 2026-10-23 observations are historical baseline only |

Full current evidence: [evidence/2026-10-24/validation.md](./evidence/2026-10-24/validation.md). Earlier browser evidence: [evidence/2026-10-23/validation.md](./evidence/2026-10-23/validation.md).

### Manual smoke-test sequence

1. Start with `npm run dev`; verify the Overview and wait for fonts/layout.
2. Change the period through 7, 30, and 90 days; verify KPI values, trend, status counts, table count, and report preview update together.
3. Search for a customer or order ID, apply a status filter, sort an amount/date column, paginate, and clear filters.
4. Export a filtered report and inspect the generated CSV headers and rows (browser-observed payload for one selected row).
5. Refresh and check loading plus success feedback; dismiss an alert; open the delayed-order action and confirm the matching order is shown.
6. Navigate each section. Toggle settings, open notifications, and confirm their feedback.
7. At narrow viewports, check the navigation drawer, Escape/close and focus return, chart/table containment, and page width.
