# Invent IO frontend

React 19 merchant application with an ESBuild production bundle and a Node server that proxies `/api/v1/*` to the deployed Invent IO backend. JavaScript/JSX source lives in `src/`. The `.mjs` files are Node build/server scripts, not the frontend framework.

The public root opens the Figma landing page W-LP-01 (`694:3`) with its original photographic hero, product illustrations, how-it-works, feature grid, Owner & Staff section, closing CTA and footer. Landing illustrations retain the Figma composition but use neutral labels instead of example names, balances or payment records; the merchant workspace uses authenticated API responses. Login and Create account link to real forms. Section links scroll without changing the application route.

## Run

Requires Node 22 or newer.

```sh
npm ci
npm run dev
```

For production, run `npm run build` followed by `npm start`. The server serves `dist/`, binds the assigned `PORT` on `0.0.0.0`, and supports reset-password and verify-email lifecycle links. `API_ORIGIN` defaults to `https://invent-io-backend-production.up.railway.app`; configure it on the server, never put provider or database secrets in the browser.

## Architecture

- `src/App.jsx`: React root, hash-route lifecycle, accessible dialogs, toasts and error boundary.
- `src/views.jsx`, `src/ui.jsx`: JSX merchant screens and shared UI.
- `src/controller.js`: merchant state and existing authentication, catalog, CSV, payment matching, permission and notification actions, connected through React event handlers and `useSyncExternalStore`.
- `src/Landing.jsx`, `src/landing/`: Figma-derived React landing sections, local image assets and responsive CSS. The design remains rendered HTML, not a screenshot used as the page.
- `public/api.js`: API client, session refresh, pagination, backend error codes and request references.
- `scripts/serve.mjs`: same-origin API proxy and static server.

There is no HTML-string rendering, `innerHTML`, `dangerouslySetInnerHTML`, demo login, browser-stored product/sale database, or simulated successful transaction in the production application. Native form validation and error feedback remain in the merchant controller.

## Validation

`npm test` runs API/CSV/money/notification/proxy/session tests. Install Playwright Chromium (`npx playwright install chromium`), then run `npm run test:ui` for browser integration tests against isolated API fixtures. These cover landing routing/local assets/mobile overflow, failed/500/successful login, registration confirmation, reset/change/verify password and email flows, product search/create/edit and escaped names, CSV import, manual cash payload, payment matching retries with a stable idempotency key, logout, read-only permissions and sale panel layout at five widths. Fixtures are tests, not a production fallback or proof of successful live database writes.

## Remaining integration work

Production backend login previously returned HTTP 500; this frontend conversion does not fix that server error or verify live account persistence. The backend team needs to inspect logs and verify its authentication and email configuration. The tenancy bootstrap must return authorized branch information for manual cash entry. Platform-wide admin, subscription billing and team integrations are incomplete pending actual API contracts. Paystack managed account setup is currently explicitly test mode; real payments are not represented as enabled. `invent.com.ng` requires DNS changes before it points to this Railway frontend.
