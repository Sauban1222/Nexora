# Validation evidence — 2026-10-24

## Environment and scope

- Workspace: NEXORA Operations Dashboard
- Runtime: Node.js v26.5.1, npm 11.17.0
- Toolchain: React 18, TypeScript 5.9, Vite 8.3.5, MSW 2, Vitest 5.0.5
- Data: generated demo data only

## Automated checks

| Check | Result |
|---|---|
| `npm run typecheck` | Passed; `tsc --noEmit`, zero diagnostics |
| `npm test` | Passed; 3 test files, 14 tests, 0 failures |
| `npm run build` | Passed; strict typecheck and Vite production build completed |
| Production chunking | Reports view emitted as a separate lazy-loaded chunk |
| Dependency audit | `npm install` after toolchain alignment reported 0 vulnerabilities; re-run before release |

Tests cover date-range boundaries, zero-filled buckets, KPI rules, input validation, CSV quoting, mock REST success/empty/error responses, invalid query ranges, and rejection of malformed order payloads.

## Editor diagnostics

VS Code Problems was run against `src/App.tsx` and the workspace after fixes. Result: no errors found. If a stale diagnostic remains locally, save the file and run **TypeScript: Restart TS Server**.

## Browser smoke check

- Vite dev server at `http://127.0.0.1:5173/` returned HTTP 200.
- Integrated browser loaded NEXORA and rendered the `Operations Overview` heading, KPI cards, and revenue trend.
- In development, page startup registers the generated MSW worker and browser API requests resolve to mock handlers.
- Changing the date range showed the loading state, then loaded four KPI cards successfully.
- Production preview REST endpoints returned 20 orders for a 7-day range, 3 alerts, an empty list for the empty scenario, and HTTP 503 for the error scenario.
- Browser Settings control switched to the empty response, showed the empty state, switched to the 503 error, showed the recoverable error state, and restored successful Overview content.

## Lighthouse

Measured against the local production preview using Lighthouse 13.5.0 and Headless Chrome 155.0.0.0, with mobile emulation:

| Metric | Before production-bundle optimization | After production-bundle optimization |
|---|---:|---:|
| Performance | 75 | 94 |
| Accessibility | 95 | 95 |
| Best Practices | 96 | 96 |
| SEO | 91 | 91 |
| Total transfer size | 225 KiB | 144 KiB |
| First Contentful Paint | 3.8 s | 2.1 s |
| Largest Contentful Paint | 3.9 s | 2.1 s |
| Total Blocking Time | 10 ms | 0 ms |

The production bundle previously downloaded the 427 KB MSW browser client even though the production preview can serve these simulated endpoints itself. The revised app loads the MSW worker only in development and registers the same mock endpoint contract in Vite's production preview middleware. This removed the client runtime from the production bundle while preserving browser-intercepted MSW in development and test coverage for all endpoint scenarios. The Reports view remains a separate lazy-loaded chunk.

Reports: `lighthouse-before.json` and `lighthouse.json`; summary: `lighthouse.md`. Scores can vary by machine, browser, network, and repeated run; these are single-run local measurements, not guarantees.

## Not measured / limitations

- No timed stakeholder or mentor usability session was performed; the 60-second goal remains an acceptance target.
- No automated cross-browser, screen-reader, or physical-device test was run in this validation pass.
- Historical 2026-10-23 viewport and interaction checks remain in `evidence/2026-10-23/validation.md`; they are not evidence of this TypeScript/MSW revision.
