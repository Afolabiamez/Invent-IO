# Invent IO frontend

Responsive, browser-only implementation of the Invent IO desktop and mobile Figma flows. Built with plain HTML, CSS and JavaScript, with no runtime package dependencies.

## Run and verify

Requires Node 22+.

```sh
cd frontend
npm run dev
npm run check
npm test
npm run build
```

Open http://localhost:4173. The root is the landing page. Open `/#/home` to review the populated owner workspace directly, or log in with `amaka@mail.com` / `inventio-demo`. Staff preview is under Account → Preview options. The staff sample email is `bisi@mail.com`, with the same demo password.

## Included flows

- Landing, mobile intros, login, create account, forgot/reset password, invite acceptance, business setup, first products and ready state.
- Owner and staff Home; Pending payments, Recorded/My sales and Not a sale; sorting, date selection and summaries.
- Manual payment, Cash editing, product quantities, mobile review, confirmation, stock deduction, sale detail, void with stock return, and restore to pending.
- Products/Stock, search and filters, product details, photo upload, add/edit, add received stock, correct count with a changed-stock guard, archive and restore.
- Wallet, transaction filters/detail, withdrawal amount and fee review, simulated confirmation/cancellation and bank account setup.
- Team, local invite links, member permissions and removal; all eight permission switches and inventory dependencies.
- Weekly summary, business settings, account and logout, form validation, unsaved-change dialogs and session-expired preview.
- Account → Preview options → Review designed states provides isolated loading/error/empty patterns, mobile intros, and withdrawal status previews.

## Design sources and responsive rules

Figma file `MLpHP16bR0l2gDUHf918yv`: desktop page `677:2`, mobile page `248:2`, layout notes `677:10`, approved mobile adaptations `737:7515`. Source assets are downloaded under public/assets; screenshots are never used as application UI.

Desktop >=1200 uses a 248px sidebar, 32px page padding and tables. Tablet 768–1199 uses a 72px rail, 24px padding and stacked detail/selection views. Mobile <768 uses 16px padding, lists, bottom navigation, full-screen forms and fixed actions. Native status bars, keyboards and gesture indicators belong to the device and are not drawn by this website. Browser amount inputs remain keyboard-accessible alongside the designed numeric keypad.

## Demo data and integration boundaries

This is an interactive design preview, not production authentication or payment processing. No API requests, real messages, bank verification or money movement occur. Passwords are never saved. Login accepts the sample identities and demo password only. Creating an account creates a local sample business. Invite links work once with a seven-day expiry only in the same browser/origin; cross-device team membership needs the backend.

Changes persist in localStorage `invent-io-design-demo-v2`. Earlier prototype data under `inventio-web-v1` is left untouched. Account → Reset demo data restores the samples. Dates follow the Figma example, Sat 3 Oct 2026. The Home aggregate includes earlier sample sales beyond the recent editable list; totals start at ₦48,500 / 14 sales / ₦12,300 known profit. Filters and counts reflect current local products rather than reproducing non-reconciled badge counts from static mockups.

`public/data.js` holds fixtures and persistence, `public/model.js` holds tested local sale/void/cancellation transitions, and `public/app.js` holds routes and UI. The six model tests cover atomic validation, duplicate sale submission, negative stock, stock reversal, price snapshots, missing cost and single refunds. These client checks are not a security boundary: production permissions, identities, financial totals, stock and payment idempotency must be enforced by authenticated backend endpoints.

Figma explicitly leaves payment-difference limits and persistence, save/retry contracts, real-time payment failures, manual cash creation contracts, backend role mapping, branch stock rules and provider-confirmed Transfer editing unresolved. The demo requires an exact selected total, leaves Transfer amounts immutable, and does not invent those production contracts. Provider status progression, real email delivery and verification failures require backend integration. Loading/error/withdrawal variants are review fixtures rather than fake background network activity.

## Railway deployment

The intended repository is **Afolabiamez/Invent-IO**, with Root Directory `/frontend`, build command `npm run build`, start command `npm start`. Set branch to the reviewed branch, or merge the PR and deploy `main`. Railway supplies `PORT`; the server binds `0.0.0.0` when PORT is present. No secrets are needed for this design preview.

The supplied live site was still the older prototype during this audit. GitHub deployment records were found on **adehsanya/Invent-IO-Frontend** (Railway project `outstanding-serenity`), while the team repo had none. Check the Railway service's Source repository, branch and root before expecting team-repo commits to deploy. A pushed PR is not evidence of a successful live deployment.
