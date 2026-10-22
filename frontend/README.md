# Invent IO Frontend

Web-first sales and inventory prototype based on the Invent IO mobile Figma flow. Desktop uses a sidebar, payment table, and sale side panel; smaller screens use bottom navigation and a full-screen sale panel.

- Backend repository: [Afolabiamez/Invent-IO](https://github.com/Afolabiamez/Invent-IO)
- Private product preview: [Inventio sales workspace](https://inventio-sales-workspace.adehsanya.chatgpt.site) (ChatGPT sign-in required)
- Figma starting screen: [Sales · Pending payments](https://www.figma.com/design/MLpHP16bR0l2gDUHf918yv/INVENT-IO?node-id=397-5476)

## Run locally

Requires Node.js 22 or newer. There are no npm dependencies and no installation step.

```sh
git clone https://github.com/Afolabiamez/Invent-IO.git
cd Invent-IO/frontend
npm run dev
```

Open http://localhost:4173. Set `PORT` to use another port.

```sh
npm run check
npm run build
```

`check` validates JavaScript syntax. `build` copies the runnable static site into `dist/`, which can be served by a static hosting service. The development server listens on loopback locally. When PORT is supplied (as on Railway), it listens on 0.0.0.0. HOST can override the listening address.

## Included flows

- Pending payments, Recorded, and Not a sale views
- Search, sorting, and recorded-date filters
- Manual payment entry with Cash, Transfer, or Card
- Product selection, quantities, live totals, and mismatch acknowledgement
- Review and confirm sale, profit calculation, and stock deduction
- Low-stock and negative-count warnings
- Sale detail, void sale, stock return, and restore to pending
- Save a payment for later, next pending payment, and summary views

## Current data model and backend handoff

This is an interactive frontend prototype. It uses sample customers, payments, products, and stock. It does not call the backend or Paystack, perform authentication, or move money. Demo dates are fixed to 15 October 2026 for repeatable review.

`public/app.js` contains the initial data, UI rendering, and state transitions. Changes persist in browser localStorage under `inventio-web-v1`; **More → Reset demo data** restores the samples. Data is local to each browser and origin.

Before production integration, agree on the API contract with the backend team. Replace local state persistence with authenticated endpoints for products, payments, sales, voiding, and summaries. Sale creation, payment matching, stock deduction, and void reversal should be handled atomically by the backend. Profit, permissions, and financial totals must be calculated and enforced server-side. Do not place server credentials or Paystack secret keys in client files.

## Structure

```text
public/
  index.html       Application shell
  app.js           Demo data, flow state, and UI handlers
  style.css        Responsive layout and design tokens
  assets/          Local Figma product images and SVG icons
scripts/
  serve.mjs        Dependency-free local HTTP server
  build.mjs        Copies static output to dist/
```

The CSS loads Inter from Google Fonts, with Arial as a fallback. Product images and icons are stored locally; the app does not rely on expiring Figma asset URLs. Hosting-specific identity and credentials are excluded from this repository.

## Validation

The original flow was manually checked in a browser at desktop and mobile widths, including matching products to payment, confirmation, stock deduction, voiding and stock return, restoring payments, saving for later, persistence after reload, and the empty date-filter state. `npm run check` is a syntax check, not an automated end-to-end test suite.

## Railway deployment

Connect Afolabiamez/Invent-IO, select branch main, and set the service Root Directory to /frontend. Use npm run build as the build command and npm start as the start command. Railway supplies PORT automatically. Generate a public domain after deployment succeeds.

## Owner Home fidelity (HM-01)

The default Home screen implements Figma node `356:4833`: Amaka Beauty/date/avatar, Wallet, Today’s sales with profit, a two-payment preview, the labeled Record payment shortcut, and active Home navigation. On desktop the same sections use two columns above the pending list; on mobile they follow the Figma stack. Native OS status/gesture chrome is provided by the browser/device rather than rendered in HTML. Payment rows expand to keep notes readable.

`public/home.js` and `public/home.css` contain this screen. Its sample daily summary includes an earlier-sales fixture (₦33,000 across 11 sales, ₦6,700 known profit, one missing-cost sale) plus the recent editable sales; it starts at the Figma’s ₦48,500 / 14 sales / ₦12,300 profit. The existing Sales screen currently lists the recent editable sample sales only. Wallet values are sample fixtures; wallet/withdraw buttons explain the pending backend integration. The demo’s Home date matches the supplied Figma sample.
