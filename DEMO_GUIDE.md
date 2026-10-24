# NEXORA — mentor demo guide

**Audience:** operations manager, team lead, or internship reviewer  
**Demo duration:** 4–6 minutes  
**Business decision:** which order needs attention first, and how does operational performance compare across periods?

## Before the demo

1. Use Node.js 20.19+ (or 22.12+).
2. Run `npm ci`, `npm test`, and `npm run build`.
3. Run `npm run dev`, then open the printed local URL.
4. Explain that all customer, order, alert, and activity records are generated examples; MSW intercepts the mock REST requests, and no live business service is connected.

## Suggested walkthrough

1. **Frame the problem (30 sec):** operations leads need one place to scan performance, find exceptions, and decide what to review next.
2. **Scan the Overview (45 sec):** explain revenue excludes cancelled records, order count includes all statuses, active customers are unique accounts, and completion rate is completed orders divided by all orders. Changes compare to the immediately preceding equal-length period.
3. **Test one decision (45 sec):** choose the delayed shipment alert. It opens Orders with its reference prefilled; confirm its customer, date, amount, and visible Delayed status.
4. **Compare periods (30 sec):** switch between 7, 30, and 90 days. KPIs, charts, status distribution, records, and report preview use the same selected range.
5. **Inspect data (45 sec):** clear the alert search; search a customer; combine the search with a status; sort amount and move to another page. Explain how filter counts and pagination reflect the same result set.
6. **Show outputs and safeguards (30 sec):** export the filtered CSV, refresh from the mock REST endpoints, then visit Analytics, Customers, Operations, Reports, and session-only Settings.
7. **Show responsive and accessible behavior (30 sec):** use the mobile navigation drawer; demonstrate Escape to close, `Ctrl+K` / `⌘K` to focus search, and the skip-to-content link. Point out that the table scrolls within its panel.
8. **Demonstrate edge states (30 sec):** in Settings, change Mock API response to Empty data, then Service error. Show the empty explanation and recovery action, then retry or switch back to successful data.

## Decision notes

- **Custom SVG instead of a chart package:** keeps dependencies and bundle weight low for a handful of short time series; point titles and text summaries provide basic chart context.
- **No forms package:** this prototype has filters and switches rather than a complex data-entry workflow.
- **MSW rather than a standalone server:** the browser makes real `fetch` requests, while MSW intercepts them and provides controllable responses without another server process.
- **TypeScript:** strict types describe the dashboard/API domain and protect calculations and component contracts.
- **Custom SVG charts:** adequate for the fixed short trends and avoid a general charting dependency; revisit if the chart scope grows.
- **No MSW client in production:** development uses MSW browser interception. The production preview serves the same simulated endpoints via Vite middleware, avoiding a 427 KB development-only browser worker in the production bundle.
- **Session-only preferences:** avoids implying server persistence or collecting personal information.

## Success criteria and evidence

Portfolio acceptance targets are to locate an exception in under one minute, keep all period-dependent views consistent, complete key keyboard workflows, pass data/calculation tests, and avoid document-level horizontal overflow at the tested widths. These targets have not been tested in a stakeholder usability study. Current implementation and verification evidence are in [REQUIREMENTS.md](./REQUIREMENTS.md); exact formulas and assumptions are in [README.md](./README.md).

## Viva prompts

- **Why build this?** A clear operations view can focus attention on exceptions and let managers inspect period trends without reconciling separate screens.
- **Most consequential decision?** Keeping a single calculation path for revenue, explicitly excluding cancelled orders, and comparing each range to a non-overlapping prior period.
- **How was correctness checked?** TypeScript and Vitest check period boundaries, aggregation, validation, KPI math, CSV quoting, and mock REST success/empty/error responses. Dated browser and Lighthouse evidence is in `evidence/`.
- **What is not production-ready?** MSW data is illustrative, no production API or authentication is present, inventory alerts are examples, and actual time savings have not been measured.
- **What changes at 10× scale?** Move aggregation/filtering to a paginated API, type and version the contract, instrument errors/performance with privacy safeguards, and add component-level/e2e tests.
