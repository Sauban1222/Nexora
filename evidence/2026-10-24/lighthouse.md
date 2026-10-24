# Lighthouse review — 2026-10-24

## Method

- Lighthouse 13.5.0, Headless Chrome 155.0.0.0.
- Mobile emulation, local production preview at `http://127.0.0.1:4175/`.
- Single run before and after removing the development-only MSW browser runtime from the production client.
- Full Lighthouse JSON: `lighthouse-before.json` and `lighthouse.json`.

## Measured comparison

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Performance | 75 | 94 | +19 |
| Accessibility | 95 | 95 | No change |
| Best Practices | 96 | 96 | No change |
| SEO | 91 | 91 | No change |
| Total transferred bytes | 225 KiB | 144 KiB | -81 KiB |
| First Contentful Paint | 3.8 s | 2.1 s | -1.7 s |
| Largest Contentful Paint | 3.9 s | 2.1 s | -1.8 s |
| Total Blocking Time | 10 ms | 0 ms | -10 ms |

## Change and limitations

The earlier production client loaded the MSW browser worker chunk at startup even though the production preview can provide the same mock REST endpoint responses itself. The client now starts MSW only in development. For production preview, Vite middleware serves the same validated range and success/empty/error scenarios, reducing total measured transfer from 225 KiB to 144 KiB.

This is a one-machine, one-browser-profile comparison. The Lighthouse score may vary between runs and should be repeated on the intended hosting platform. It is not evidence of user-perceived speed across all devices.
