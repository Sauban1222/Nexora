# LinkedIn post draft

I built **NEXORA**, an operations dashboard prototype, as Project 2 of my Arrowstack frontend internship.

The goal was to help an operations lead find an order that needs attention and compare operational trends from one responsive interface. The dashboard includes KPIs, alerts, accessible trend charts, validated filters, and a sortable, paginated order table.

I used React, strict TypeScript, Vite, and MSW to simulate REST responses—including loading, empty, and service-error states. I also added typed response validation, reusable UI states, keyboard workflows, memoized calculations, a lazy-loaded Reports view, and automated tests.

**Performance evidence:** Lighthouse mobile Performance improved from 75 to 94 after removing the development-only MSW worker from the production bundle; measured transfer size fell from 225 KiB to 144 KiB in one local run. Full results are in `evidence/2026-10-24/lighthouse.md`.

All records are generated examples. The 60-second exception-review target is an evaluation goal, not a measured productivity claim. My next step is to run the timed mentor review and use the results to prioritize usability improvements.

#FrontendDevelopment #React #TypeScript #Accessibility #InternshipProject #DataVisualization
