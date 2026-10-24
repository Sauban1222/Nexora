# NEXORA — Operations Dashboard UI

NEXORA is an executive-facing operations dashboard prototype for an operations manager or team lead. It supports the decision “which order should I review first, and how is operational performance changing?” using illustrative records only.

> **Data and privacy:** all orders, alerts, and activity are generated/simulated. MSW intercepts browser requests to mock REST endpoints. There is no live API, authentication, user tracking, or persistent personal data.

## Requirements and measurable outcomes

The primary stakeholder, problem statement, scope boundaries, assumptions, acceptance checklist, success metrics, decisions and production-readiness roadmap are recorded in [REQUIREMENTS.md](./REQUIREMENTS.md). The 60-second exception-review target is a proposed usability measure—not a claim of measured improvement. Record timed mentor walkthrough results in the dated evidence folder.

## Features

- Seven responsive views: Overview, Analytics, Orders, Customers, Operations, Reports, and Settings.
- KPI cards, operational alerts, accessible SVG trend/status charts, and shared 7/30/90-day range selection.
- Client-side range/status validation; trimmed search; sortable order columns; eight-row pagination; CSV export.
- Simulated loading delay plus controllable success, empty, and HTTP error scenarios from Settings.
- Retry and successful-data recovery actions; server response records validated before use.
- Semantic landmarks/table, keyboard navigation, visible focus, skip link, chart text labels, and mobile drawer behavior.
- Memoized dashboard calculations, paginated table, and lazy-loaded Reports view.

## Technology choices

- React 18, TypeScript (strict), Vite 8, MSW 2, and Vitest.
- The existing custom SVG visualizations were retained instead of adding a chart library: the small, fixed series do not currently justify its dependency and bundle cost. This is a documented deviation from the recommended chart-library stack.
- MSW browser handlers simulate REST endpoints at `/api/orders`, `/api/alerts`, and `/api/activity`. The date-range query is validated and applied to orders. A demo scenario query selects `success`, `empty`, or `error`.
- Generated sample data is deterministic in structure, but dates are relative to the current day. No third-party source data is used.

## Project structure

```text
src/
  api/                 Typed REST client and endpoint tests
  components/          Shared loading/error/empty state component
  hooks/               Dashboard data request state
  mocks/               MSW browser worker and REST handlers
  pages/               Lazy-loaded Reports view
  App.tsx              Dashboard shell and primary views
  data.ts              Generated data and period aggregation
  types.ts             API and domain contracts
  utils.ts             Validation, calculations, and formatting
  styles.css           Design tokens and responsive components
evidence/YYYY-MM-DD/   Work log, automated/browser evidence, Lighthouse result
```

## Reproduce locally

Use Node.js 20.19+ or 22.12+ and npm:

```powershell
npm ci
npm run dev
```

Open the local URL from Vite. The first page load registers `public/mockServiceWorker.js`; the service worker must be available from the same origin.

```powershell
npm run typecheck
npm test
npm run build
npm run preview
```

`npm run build` runs the strict typecheck before bundling. Vitest runs calculation, validation, and mock REST tests. See [DEMO_GUIDE.md](./DEMO_GUIDE.md) for a walkthrough and state scenarios.

## Data integrity rules

- Revenue excludes Cancelled orders; order count includes every order.
- Active customers are unique accounts with an order in the selected period.
- Completion rate is Completed orders divided by all orders, displayed as a percentage.
- KPI comparisons use the immediately previous, non-overlapping equal-length period.
- Search matches reference, customer, item, and status; status and search combine.
- CSV includes the selected range and current filters; fields are quoted/escaped.
- Malformed orders and response contract violations fail visibly; no successful-data fallback masks a request failure.

## Validation and evidence

Validation commands and their actual results are recorded in [evidence/2026-10-24/validation.md](./evidence/2026-10-24/validation.md). Prior 2026-10-23 browser evidence remains historical and is not relabelled as a current run. Full before/after Lighthouse JSON and score comparison are recorded in [evidence/2026-10-24/lighthouse.md](./evidence/2026-10-24/lighthouse.md).

Production Lighthouse (mobile emulation, Lighthouse 13.5.0, local production preview): **Performance 94**, **Accessibility 95**, **Best Practices 96**, **SEO 91**. Following removal of the MSW browser runtime from the production bundle (dev still uses browser-intercepted MSW; production preview uses the same typed mock endpoints through Vite preview middleware), total transferred bytes fell from 225 KiB to 144 KiB and LCP from 3.9 s to 2.1 s in the recorded run. These are single-run local measurements, not a universal performance guarantee. Full JSON reports are in the dated evidence folder.

## Limitations and next steps

- This is not an authenticated, live, persistent, or production API. Inventory and approval alerts are illustrative workflows.
- The React UI is migrated to strict TypeScript; the custom SVG charts are retained rather than introducing a chart library.
- No real stakeholder study has established time savings. Run the timed review task with a mentor before claiming an outcome.
- Next: add browser-level automated tests, a production API contract/service, role-based access and privacy review, real telemetry with retention controls, and design governance.

See [DEMO_GUIDE.md](./DEMO_GUIDE.md), [PORTFOLIO_POST.md](./PORTFOLIO_POST.md), and [REQUIREMENTS.md](./REQUIREMENTS.md) for presentation materials and evidence mapping.
