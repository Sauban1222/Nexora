# Validation evidence — 2026-10-23

## Environment

- Project: NEXORA Operations Dashboard
- Toolchain: Node.js 26.5.1, npm 11.17.0, React 18, Vite 8.3.5
- Browser: VS Code in-app Chromium browser
- Evidence type: dated text record; this workspace is not a Git repository

## Automated checks

### `npm test`

```text
tests 9
pass 9
fail 0
```

Coverage includes generated-record uniqueness, date-range bounds, invalid ranges, empty daily buckets, cancelled-order revenue exclusion, status totals, malformed/duplicate record validation, KPI arithmetic, zero baselines, and CSV quoting.

### `npm run build`

```text
vite v8.3.5 building client environment for production
17 modules transformed
build completed successfully
```

### `npm audit --json`

```text
total vulnerabilities: 0
dependency tree: 45 packages
```

## Browser checks

- Overview rendered four KPIs, revenue chart, order-status distribution, three alerts, and eight recent order rows with no page errors.
- Navigation reached Overview, Analytics, Orders, Customers, Operations, Reports, and Settings.
- Date ranges changed summary and trends. Customer search returned seven matches; combining Delayed status returned three; a nonexistent query displayed the empty state.
- Sort, pagination, alert-to-order navigation, alert dismissal, notification Escape handling, settings toggle feedback, CSV payload, refresh feedback, and visible refresh timestamp were exercised.
- All seven destinations were opened at 320px and 375px widths. Overview document width was checked at 320, 375, 768, 1024, and 1440 CSS pixels; no document-level horizontal overflow was observed. Order tables use their own horizontal scroll region where needed.
- At 768px, the mobile/tablet drawer opened and closed with Escape. At 320px, the dashboard remained within the available viewport.
- Skip-to-content and `Ctrl+K` search focus were checked.

## Limits

- Browser verification is a manual in-app smoke check, not an automated cross-browser/device suite.
- No stakeholder usability study or time-saving result has been measured. The under-one-minute exception-review goal is a portfolio acceptance target.
- Demo data, simulated refresh, and browser CSV behavior do not establish API/backend production readiness.
