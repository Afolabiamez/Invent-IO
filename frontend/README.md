# Invent IO frontend

Responsive web frontend in the central Invent-IO repository. This change adds authenticated backend integration for catalog/CSV import, web notifications and merchant self-onboarding. Backend code is unchanged.

## Run, test and deploy

Requires Node 22+. There are no runtime npm dependencies.

```sh
cd frontend
npm run dev
npm run check
npm test
npm run build
```

Open http://localhost:4173. Normal routes use real API authentication. The original isolated Figma demo is available at `/?demo=1#/home` (sample login: amaka@mail.com / inventio-demo); its data never becomes backend data.

For Railway: Root Directory `/frontend`, build `npm run build`, start `npm start`. `PORT` is assigned by Railway and the server binds 0.0.0.0. Leave deployment to the cloud engineer.

The Node server serves the app and proxies `/api/v1/*` to **https://invent-io-backend-production.up.railway.app/v1/**. This is the supplied host, using HTTPS to avoid mixed content and credential transport over HTTP. Set `API_ORIGIN` on the frontend service to override the upstream origin. The proxy is fixed to that origin, does not forward browser cookies, follows no redirects, and returns no-store responses. Do not put backend/Paystack/VAPID private keys in frontend files. Uploading `dist` to a static-only host requires an equivalent `/api` reverse proxy; `npm start` already supplies it.

## Connected flows

- Register/login, bearer access token, single-flight refresh with rotated refresh tokens, forgot/reset password, logout and session-expired handling. Session tokens stay in sessionStorage, not localStorage; passwords are not retained. Tenant permissions come from `/v1/tenancy/me` and are never inferred from email or UI role toggles.
- Cursor-paginated products, product create/edit, exact naira/kobo conversion, pending payments, sales allocation and dashboard/report reads. Sale requests retain an idempotency key across retries; a 409 refreshes the queue. Variance is displayed and does not block confirmation. The backend owns prices, totals and stock updates. The connected view never silently falls back to sample balances or local simulated mutations.
- Catalog → Import CSV: UTF-8/BOM/quoted fields, header and row validation, first-five-row preview, explicit naira vs kobo units, downloaded template, and POST `/v1/products/import` with `{ csv }`. Required: name, price, cost. Optional: sku, barcode, unit. Up to 5,000 rows and 2 MB on the client; the upstream server’s JSON body limit also applies. Price/cost are normalized to integer minor units as CSV strings with BigInt arithmetic. The catalog API’s numeric Int fields are range-checked before conversion. Stock columns are ignored with a warning because the import endpoint does not accept them. Partial success shows created/updated/skipped counts and per-row errors. Matching SKUs upsert; rows without SKUs may duplicate on retry. Ambiguous network failure clears the pending submission and asks the user to inspect the catalog first.
- Notifications: authenticated GET `/v1/push/vapid-public-key`, user-clicked browser permission request, `PushManager.subscribe()`, then POST `/v1/push/subscriptions` with only endpoint and keys. A failed server registration rolls back a newly created browser subscription. Account can retry setup or stop delivery using DELETE `/v1/push/subscriptions`. Logout stops local delivery before revoking the session. The service worker displays `{ title, body }` and opens a fixed same-origin Home route on click; no authenticated content is cached. Includes PWA manifest, PNG icons and Apple touch icon.
- iPhone/iPad: install with Safari → Share → Add to Home Screen, then open from the icon; requires iOS/iPadOS 16.4+. Unsupported browsers, insecure contexts, denied permission and absent server configuration have explicit messages. No native permission prompt is requested on page load.
- Onboarding → “No, help me set up”: collects the exact `CreateManagedPaymentAccountDto` fields, settlement details and explicit owner consent, then POSTs `/v1/payments/managed-account`. GET of the same route shows returned status and bank/account details, including partial provisioning that can resume using the same details. Settlement account numbers are not stored in the browser. This is the backend’s Paystack test-mode flow, not live activation or a fabricated wallet.
- Account overview (`/#/admin`) is limited to the authenticated organization and `payments.manage`. It shows managed account status and self-onboarding controls; it does **not** pretend that merchant-owner permission grants platform-admin access.

## Backend handoff / remaining contracts

The repo source and deployed API differ. Read-only checks on 29 October 2026 found `/reference` live (the source mounts Scalar there), but GET `/v1/push/vapid-public-key` and an unauthenticated POST `/v1/products/import` with an empty CSV both returned 404. The same-origin proxy solves browser CORS, but it cannot create missing backend routes. The cloud engineer must deploy the current backend and configure its VAPID keys before real push delivery can be verified. No real merchant, subscription or Paystack account was created during testing.

The user confirmed that no platform-admin API contract has been supplied. Global account listing/search, account approvals, cross-merchant actions and platform-admin authorization therefore remain blocked. The frontend must not fabricate endpoints or grant `*` merchant owners cross-tenant access.

DIRECT setup has no exposed configuration endpoint in the current controllers. “Yes, I have Paystack” explains that the backend team must supply the organization’s webhook setup; it does not collect a secret that cannot be submitted securely. There is also no bank-list/verification endpoint: managed setup accepts the documented settlement bank code rather than inventing or scraping a bank list. Product photos, team management, weekly summaries, wallet/withdrawals and existing design-only settings remain in demo mode until their corresponding contracts are connected. Socket.IO live wake/reconnect is a separate outstanding integration; this PR adds background Web Push and refetches the payment queue when opening Home/Sales.

`/v1/tenancy/me` currently requires wildcard permission in the backend source. Non-owner sessions may receive 403 and cannot bootstrap their scoped permissions; this needs a backend contract change rather than a frontend bypass. The frontend displays the error and keeps access restricted.

## Validation

`npm run check`, `npm test` (14 tests), `npm run build`, and `git diff --check`. Tests cover exact money, quoted CSV and validation, rotating-token concurrency, API errors, iPhone support, push subscription rollback, service worker title/body/click handling and fixed-origin proxy headers. Existing six local demo transition tests remain intact.

`node tests/mock-server.mjs` starts an isolated UI fixture on http://localhost:4181. Its fake auth/catalog/provisioning responses never call an external service. Manually verified login, notification explanation/defer, CSV preview and partial import results, and automated onboarding returning a virtual-account status. Real push subscription/delivery and provider provisioning still require the deployed backend and a consenting test user.

