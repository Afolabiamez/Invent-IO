import { createApi } from "./api.js";
import { createPush } from "./notifications.js";
import { prepareImport, MAX_CSV_BYTES } from "./csv-import.js";
import { formatMinor, nairaToMinor, safeMinorNumber } from "./money.js";

export function createLiveApp({ ui, rerender }) {
  const {
    esc,
    btn,
    link,
    field,
    notice,
    empty,
    ico,
    brand,
    go,
    toast,
    modal,
    closeModal,
  } = ui;
  const $ = (s, r = document) => r.querySelector(s);
  const state = {
    payments: [],
    sales: [],
    summary: null,
    coreErrors: [],
    coreLoading: false,
    quantities: {},
    paymentId: null,
    saleKey: null,
    allocating: false,
    tenant: null,
    products: [],
    managed: null,
    loading: false,
    error: "",
    catalogError: "",
    accountError: "",
    csv: null,
    csvText: "",
    fileName: "",
    units: "naira",
    result: null,
    importing: false,
    profile: null,
    pushReady: false,
    pushMessage: "",
    prompting: false,
    enabled: false,
    initialized: false,
    submitting: false,
  };
  let generation = 0, lastRoute = "";
  const api = createApi({
    onExpired: () => {
      generation++;
      clearData();
      push.disable().catch(() => {});
      go("login", true);
      toast("Session expired. Please log in again.");
    },
  });
  const push = createPush({ api });
  const can = (p) =>
    state.tenant?.permissions?.includes("*") ||
    state.tenant?.permissions?.includes(p);
  const person = () =>
    state.profile || {
      name: api.session?.name || "Your account",
      email: api.session?.email || "",
    };
  const message = (error) =>
    error.message + (error.requestId ? " · Reference: " + error.requestId : "");
  const notifyError = (error) => toast(message(error));
  const status = (label, kind = "") =>
    `<span class="status ${kind}">${esc(label)}</span>`;
  const kv = (label, value) =>
    `<div class="kv"><span>${label}</span><strong>${esc(value)}</strong></div>`;
  function clearData() {
    Object.assign(state, {
      tenant: null,
      products: [],
      managed: null,
      payments: [],
      sales: [],
      summary: null,
      quantities: {},
      paymentId: null,
      saleKey: null,
      initialized: false,
      loading: false,
      coreLoading: false,
      catalogError: "",
      accountError: "",
      error: "",
      csv: null,
      csvText: "",
      result: null,
      pushReady: false,
      enabled: false,
      prompting: false,
    });
  }
  function shell(
    title,
    body,
    { back = "", action = "", active = lastRoute, cls = "" } = {},
  ) {
    const nav = [
      ["home", "Home", "navHome"],
      ...(can("sales.allocate") ? [["sales", "Sales", "navSales"]] : []),
      ...(can("catalog.read") ? [["products", "Products", "navProducts"]] : []),
      ["account", "Account", "navSettings"],
    ];
    return `<aside class="sidebar"><a href="#/welcome" class="sidebar-brand">${brand()}<p>${esc(api.session?.businessName || "Your business")}</p></a><nav class="side-nav">${nav.map(([r, t, i]) => `<a href="#/${r}" class="${active === r ? "active" : ""}">${ico(i)}<span class="nav-label">${t}</span></a>`).join("")}${can("payments.manage") ? `<span class="side-heading">PAYMENTS</span>${link("Payment setup", "onboarding", "list-link")}${link("Account overview", "admin", "list-link")}` : ""}</nav><a class="account-link" href="#/account"><span class="avatar">${esc((person().name || "A")[0].toUpperCase())}</span><div><strong>${esc(person().name)}</strong><small>${esc(person().email)}</small></div></a></aside><div class="workspace"><header class="topbar"><div class="title-group">${back ? `<button class="icon-btn" data-live="go" data-to="${back}" aria-label="Back">${ico("back")}</button>` : ""}<h1>${esc(title)}</h1></div><div>${action}</div></header><main class="content ${cls}">${body}</main></div><nav class="bottom-nav live-nav" style="grid-template-columns:repeat(${nav.length},minmax(0,1fr))!important">${nav.map(([r, t, i]) => `<a href="#/${r}" class="${active === r ? "active" : ""}">${ico(i)}<span>${t}</span></a>`).join("")}</nav>`;
  }
  function auth(kind) {
    const title =
      kind === "create"
        ? "Create account"
        : kind === "forgot"
          ? "Forgot password"
          : kind === "reset"
            ? "Set new password"
            : "Log in";
    return `<div class="auth-layout"><aside class="auth-brand"><a href="#/welcome">${brand()}</a><div class="auth-brand-copy"><h1>Every sale, automatically tracked.</h1><p>Know what sold. Know what’s left.</p></div></aside><div class="auth-mobile-header">${link(ico("back"), "welcome", "icon-btn")}${title}</div><main class="auth-main"><form class="auth-form" id="live-auth" data-kind="${kind}" novalidate><div class="auth-heading"><h1>${title}</h1></div>${kind === "create" ? field("name", "Your name", "", "text", "", 'required autocomplete="name"') + field("businessName", "Business name", "", "text", "", "required") : ""}${kind !== "reset" ? field("email", "Email", "", "email", "", 'required autocomplete="username"') : ""}${kind !== "forgot" ? field("password", kind === "reset" ? "New password" : "Password", "", "password", kind !== "login" ? "At least 8 characters" : "", "required " + (kind === "login" ? 'autocomplete="current-password"' : 'minlength="8" autocomplete="new-password"')) : ""}${kind === "reset" ? field("confirm", "Confirm password", "", "password", "", 'required autocomplete="new-password"') : ""}${kind === "login" ? link("Forgot password?", "forgot", "text-btn") : ""}<p class="form-error" role="alert" id="live-error"></p><div class="auth-bottom"><button class="primary" type="submit" ${state.submitting ? "disabled" : ""}>${state.submitting ? "Please wait…" : kind === "forgot" ? "Send reset link" : kind === "reset" ? "Save new password" : title}</button>${link(kind === "login" ? "Create account" : "Back to log in", kind === "login" ? "create" : "login", "text-btn")}</div></form></main></div>`;
  }
  async function initialize() {
    if (!api.session || state.loading) return;
    const turn = ++generation;
    state.loading = true;
    state.error = "";
    rerender();
    try {
      const tenant = await api.request("/tenancy/me");
      if (turn !== generation) return;
      if (!Array.isArray(tenant?.permissions))
        throw new Error("The backend did not return your access permissions.");
      state.tenant = tenant;
      state.initialized = true;
      await Promise.all([loadProducts(), loadManaged(), loadCore()]);
      if (turn !== generation) return;
      prepareNotifications();
    } catch (error) {
      if (turn === generation) state.error = message(error);
    } finally {
      if (turn === generation) {
        state.loading = false;
        rerender();
      }
    }
  }
  async function loadProducts() {
    if (!can("catalog.read")) return;
    state.catalogError = "";
    const turn = generation;
    try {
      const rows = await api.pages("/products");
      if (turn === generation) state.products = rows;
    } catch (error) {
      if (turn === generation) state.catalogError = message(error);
    }
  }
  async function loadManaged() {
    if (!can("payments.manage")) return;
    state.accountError = "";
    const turn = generation;
    try {
      const account = await api.request("/payments/managed-account");
      if (turn === generation) state.managed = account;
    } catch (error) {
      if (turn === generation) state.accountError = message(error);
    }
  }
  async function prepareNotifications() {
    const turn = generation;
    const support = push.support();
    if (!support.supported) {
      state.pushMessage = support.message;
      rerender();
      return;
    }
    try {
      const ready = await push.prepare();
      if (turn !== generation) return;
      state.enabled = ready.subscribed;
      state.pushReady = true;
      state.pushMessage = "";
      rerender();
      if (
        Notification.permission === "default" &&
        !sessionStorage.getItem("invent-push-later-" + api.session?.userId) &&
        !state.prompting
      ) {
        state.prompting = true;
        modal(
          "Allow notifications?",
          `<p>Get a notification when a payment arrives or stock runs low, even when Invent IO isn’t open.</p><p class="caption muted">You can change this in Account at any time.</p>`,
          btn("Not now", "unused", "secondary", 'data-live="push-later"') +
            btn(
              "Allow notifications",
              "unused",
              "primary",
              'data-live="push-enable"',
            ),
        );
      }
    } catch (error) {
      if (turn !== generation) return;
      state.pushReady = false;
      state.pushMessage = message(error);
      rerender();
    }
  }
  function home() {
    return shell(
      "Home",
      `<div class="stack">${dashboard()}<section class="card pad stack-sm"><h2>Welcome${api.session?.businessName ? " to " + esc(api.session.businessName) : ""}</h2><p class="muted">Start with your catalog, then connect your payment account.</p><div class="chips">${can("catalog.read") ? link("View catalog", "products", "primary") : ""}${can("catalog.write") ? link("Import products from CSV", "import", "secondary") : ""}${can("payments.manage") ? link("Set up payments", "onboarding", "secondary") : ""}</div></section><section class="card pad stack-sm"><h2>Notifications</h2><p class="caption muted">Payment and low-stock alerts are delivered to this browser after you allow notifications.</p>${notificationControls()}</section>${state.catalogError ? notice(esc(state.catalogError), "warning") : ""}${can("payments.manage") ? accountCard() : ""}</div>`,
    );
  }
  function notificationControls() {
    const support = push.support();
    return `<p class="caption muted">${esc(state.pushMessage || (!support.supported ? support.message : state.enabled ? "Notifications enabled on this device." : typeof Notification !== "undefined" && Notification.permission === "denied" ? "Notifications are blocked in browser settings." : "Notifications are off on this device."))}</p><div class="chips">${support.supported ? `<button class="secondary" data-live="${state.pushReady ? "push-enable" : "push-prepare"}" ${typeof Notification !== "undefined" && Notification.permission === "denied" ? "disabled" : ""}>${state.pushReady ? "Allow notifications" : "Set up notifications"}</button><button class="text-btn" data-live="push-disable">Turn off notifications</button>` : ""}</div>`;
  }
  function products() {
    const rows = state.products.filter((p) => p.active !== false);
    return shell(
      "Products",
      `<div class="toolbar"><label class="search">${ico("search")}<input id="live-search" type="search" placeholder="Search products" aria-label="Search products"></label><div class="chips">${can("catalog.write") ? link("Import CSV", "import", "secondary") + link("Add product", "catalog-new", "primary") : ""}<button class="text-btn" data-live="refresh-products">Refresh</button></div></div>${state.catalogError ? notice(esc(state.catalogError), "warning") : ""}<div class="card" id="live-catalog">${rows.length ? catalogRows(rows) : empty("No products yet", "Add your products one by one, or import an existing spreadsheet as CSV.", can("catalog.write") ? link("Import CSV", "import", "primary") : "")}</div><p class="table-note">Prices are shown in naira. The API receives integer kobo amounts.</p>`,
      { active: "products" },
    );
  }
  function catalogRows(rows) {
    return rows
      .map(
        (p) =>
          `<a class="list-link" href="#/catalog-edit?id=${encodeURIComponent(p.id)}"><span class="product-placeholder">${ico("package")}</span><div class="grow"><strong>${esc(p.name)}</strong><p>${formatMinor(p.price)}${p.cost != null ? " · cost " + formatMinor(p.cost) : ""}${p.sku ? " · " + esc(p.sku) : ""}</p></div>${ico("caret")}</a>`,
      )
      .join("");
  }
  function importScreen() {
    const batch = state.csv;
    return shell(
      "Import products",
      `<div class="stack"><section class="card pad stack-sm"><h2>Bring your existing catalog</h2><p class="muted">Export your spreadsheet as CSV. Required columns: <strong>name, price, cost</strong>. Optional: sku, barcode, unit.</p><a class="text-btn" href="catalog-template.csv" download>Download CSV template (naira)</a><label class="field">CSV file<input id="live-csv" type="file" accept=".csv,text/csv" ${state.importing ? "disabled" : ""}><span class="hint">Up to 5,000 rows and 2 MB. Excel files must be exported as CSV.</span></label><label class="field">Price and cost in your file<select id="live-units" ${state.importing ? "disabled" : ""}><option value="naira" ${state.units === "naira" ? "selected" : ""}>Naira — 1500 means ₦1,500</option><option value="kobo" ${state.units === "kobo" ? "selected" : ""}>Kobo — 150000 means ₦1,500</option></select></label><p class="form-error" id="import-error" role="alert"></p>${
        batch
          ? `<p><strong>${esc(state.fileName)}</strong> · ${batch.preview.length} rows ready</p>${batch.withoutSku ? notice(`${batch.withoutSku} rows have no SKU. Importing those rows again creates additional products; it does not update them.`, "warning") : notice("Matching SKUs update existing products. Review the file before importing.")}${batch.ignoredColumns.length ? notice("These columns will not be imported: " + esc(batch.ignoredColumns.join(", ")) + ". Stock quantities are not imported by this endpoint.", "warning") : ""}<div class="import-preview"><table class="data-table"><thead><tr><th>Name</th><th>SKU</th><th>Price</th><th>Cost</th></tr></thead><tbody>${batch.preview
              .slice(0, 5)
              .map(
                (p) =>
                  `<tr><td>${esc(p.name)}</td><td>${esc(p.sku || "—")}</td><td>${formatMinor(p.price)}</td><td>${formatMinor(p.cost)}</td></tr>`,
              )
              .join(
                "",
              )}</tbody></table></div><p class="small muted">Preview shows the first ${Math.min(5, batch.preview.length)} rows. Prices are converted to integer kobo before upload.</p><button class="primary" data-live="import-submit" ${state.importing ? "disabled" : ""}>${state.importing ? "Importing…" : "Import " + batch.preview.length + " products"}</button>`
          : ""
      }</section>${state.result ? importResult() : ""}</div>`,
      { back: "products", active: "products", cls: "medium" },
    );
  }
  function importResult() {
    const r = state.result;
    return `<section class="card pad stack-sm" role="status"><h2>Import complete</h2><div class="summary-grid"><div><span>Created</span><strong class="money-lg">${r.created}</strong></div><div><span>Updated</span><strong class="money-lg">${r.updated}</strong></div><div><span>Skipped</span><strong class="money-lg">${r.skipped}</strong></div></div>${r.errors.length ? `<p class="caption">Fix the skipped data rows below before importing again. Row numbers exclude the header. Don’t re-import successful rows without SKUs.</p><ul>${r.errors.map((e) => `<li class="caption">Data row ${esc(e.row)}: ${esc(e.message)}</li>`).join("")}</ul>` : "<p>All rows were imported.</p>"}${link("View catalog", "products", "primary")}</section>`;
  }
  function editor(id) {
    const p = id ? state.products.find((p) => p.id === id) : null;
    if (id && !p)
      return shell(
        "Product",
        empty("Product not found", "Refresh the catalog and try again."),
        { back: "products" },
      );
    if (!can("catalog.write"))
      return shell(
        "Product",
        `<div class="card">${kv("Name", p.name)}${kv("Selling price", formatMinor(p.price))}${kv("SKU", p.sku || "—")}</div>`,
        { back: "products", cls: "narrow" },
      );
    const decimal = (x) => {
      const n = BigInt(x ?? 0);
      return (
        (n / 100n).toString() + "." + (n % 100n).toString().padStart(2, "0")
      );
    };
    return shell(
      p ? "Edit product" : "Add product",
      `<form id="live-product" data-id="${esc(id || "")}" class="card pad stack" novalidate>${field("name", "Product name", p?.name || "", "text", "", "required")}${field("sku", "SKU (optional)", p?.sku || "")}${field("price", "Selling price (₦)", p ? decimal(p.price) : "", "text", "", 'required inputmode="decimal"')}${field("cost", "Cost price (₦)", p ? decimal(p.cost) : "", "text", "The catalog API currently requires a cost price.", 'required inputmode="decimal"')}<p class="form-error" id="live-error"></p><button class="primary" type="submit">Save product</button></form>`,
      { back: "products", cls: "narrow", active: "products" },
    );
  }
  function accountCard() {
    const a = state.managed;
    return `<section class="card pad stack-sm"><h2>Payment account</h2>${state.accountError ? notice(esc(state.accountError), "warning") : a ? `<div class="between"><span>Status</span>${status(a.status, a.status === "ACTIVE" ? "good" : "warn")}</div>${(a.virtualAccounts || []).map((v) => `<div class="card">${kv("Bank", v.bankName)}${kv("Account name", v.accountName)}${kv("Account number", v.accountNumber)}${kv("Account status", v.status)}</div>`).join("")}${!a.virtualAccounts?.length ? notice("Your account setup is not complete. Continue with the same settlement details to resume.", "warning") : ""}` : '<p class="muted">No managed account is set up yet.</p>'}<p class="small muted">Paystack test mode · account setup does not mean live payments or withdrawals are enabled.</p>${link(a && !a.virtualAccounts?.length ? "Continue setup" : "Payment setup", "onboarding", "secondary")}<button class="text-btn" data-live="refresh-account">Refresh status</button></section>`;
  }
  function onboarding() {
    if (!can("payments.manage"))
      return shell(
        "Payment setup",
        empty(
          "You don’t have access",
          "Ask your business owner to set up payments.",
        ),
      );
    return shell(
      "Set up payments",
      `<div class="stack"><section class="card pad stack-sm"><h2>Do you have a Paystack account?</h2><p class="muted">Choose how your business will receive payments.</p><div class="chips">${link("Yes, I have Paystack", "onboarding-direct", "secondary")}${link("No, help me set up", "onboarding-managed", "primary")}</div></section>${accountCard()}${can("catalog.write") ? link("Import your products from CSV", "import", "text-btn") : ""}</div>`,
      { back: "home", cls: "narrow" },
    );
  }
  function managedForm() {
    if (!can("payments.manage")) return onboarding();
    if (state.managed?.virtualAccounts?.length)
      return shell("Payment account", accountCard(), {
        back: "onboarding",
        cls: "narrow",
      });
    return shell(
      "Set up your payment account",
      `<form id="live-managed" class="card pad stack" novalidate>${notice("This creates a Paystack test subaccount and dedicated virtual account. Live activation and provider checks remain with the backend/payment provider.")}<div class="form-grid">${field("businessName", "Registered business name", api.session?.businessName || "", "text", "", 'required minlength="2"')}${field("ownerName", "Owner’s full name", api.session?.name || "", "text", "", 'required minlength="2"')}${field("ownerEmail", "Owner’s email", person().email, "email", "", "required")}${field("ownerPhone", "Phone (optional)", "", "tel")}${field("customerFirstName", "Customer first name", "", "text", "", "required")}${field("customerLastName", "Customer last name", "", "text", "", "required")}${field("settlementBankCode", "Settlement bank code", "", "text", "Use the Paystack bank code supplied by your bank/setup team.", 'required inputmode="numeric" pattern="[0-9]{3,5}"')}${field("settlementAccountNumber", "Settlement account number", "", "text", "", 'required inputmode="numeric" pattern="[0-9]{8,20}" autocomplete="off"')}</div><label class="consent"><input type="checkbox" name="ownerConsent" required> I am authorized to submit these business, contact and settlement account details to Invent IO and Paystack for account setup.</label><p class="small muted">Settlement account numbers are sent securely to the backend and are not saved in this browser.</p><p class="form-error" id="live-error"></p><button class="primary" type="submit">Create test payment account</button></form>`,
      { back: "onboarding", cls: "medium" },
    );
  }
  function direct() {
    return shell(
      "Connect your Paystack account",
      `<div class="card pad stack"><h2>Your money stays with your bank</h2><p class="muted">Your own Paystack account receives payments directly. A managed wallet is not required.</p>${notice("The backend has not exposed a DIRECT connection/setup endpoint yet. Ask the backend team to configure your webhook connection and provide your organization’s webhook URL.", "warning")}<p class="caption">Do not paste a Paystack secret into an unsecured form or chat. This page does not collect or store it.</p>${link("Back to payment options", "onboarding", "secondary")}</div>`,
      { back: "onboarding", cls: "narrow" },
    );
  }
  function account() {
    return shell(
      "Account",
      `<div class="stack"><div class="card">${kv("Email", person().email)}${kv("Organization ID", state.tenant?.organizationId || "Unavailable")}${kv("Access", state.tenant?.permissions?.join(", ") || "Unavailable")}</div><section class="card pad stack-sm"><h2>Notifications</h2>${notificationControls()}</section>${can("payments.manage") ? link("Payment account setup", "onboarding", "secondary") : ""}<button class="secondary" data-live="logout">Log out</button></div>`,
      { cls: "narrow" },
    );
  }
  function admin() {
    if (!can("payments.manage"))
      return shell(
        "Accounts",
        empty(
          "You don’t have access",
          "Only an authorized account manager can view payment setup.",
        ),
      );
    return shell(
      "Account overview",
      `<div class="stack">${notice("This view is limited to your authenticated organization. Cross-merchant account listing, approvals and admin roles need a backend admin API; no cross-merchant actions are available.", "warning")}${accountCard()}${link("Merchant self-onboarding", "onboarding", "primary")}</div>`,
      { back: "home", cls: "narrow" },
    );
  }
  function render(route, params) {
    const previousRoute = lastRoute;
    lastRoute = route;
    if (
      previousRoute !== route &&
      state.initialized &&
      ["home", "sales"].includes(route)
    )
      queueMicrotask(async () => {
        await loadCore();
        rerender();
      });
    document.title = "Invent IO";
    if (route === "welcome") return null;
    if (["login", "create", "forgot", "reset"].includes(route))
      return auth(route);
    if (route === "check")
      return shell(
        "Check your email",
        empty(
          "Check your email",
          "If your email is registered, a reset link will be sent.",
          link("Back to log in", "login", "primary"),
        ),
        { cls: "narrow" },
      );
    if (!api.session) return auth("login");
    if (!state.initialized && !state.loading && !state.error)
      queueMicrotask(initialize);
    if (state.loading)
      return shell(
        "Loading",
        `<div class="stack" role="status"><p>Loading your workspace…</p><div class="skeleton"></div></div>`,
      );
    if (state.error)
      return shell(
        "Workspace unavailable",
        `${notice(esc(state.error), "warning")}<div class="chips"><button class="primary" data-live="retry">Try again</button><button class="secondary" data-live="logout">Log out</button></div>`,
      );
    if (!state.initialized)
      return shell("Loading", "<p>Loading your workspace…</p>");
    const screens = {
      home,
      sales: salesScreen,
      "match-payment": matchScreen,
      products,
      import: importScreen,
      onboarding,
      "onboarding-managed": managedForm,
      "onboarding-direct": direct,
      account,
      admin,
      "catalog-new": () => editor(),
      "catalog-edit": () => editor(params.get("id")),
    };
    return screens[route]
      ? screens[route]()
      : shell(
          "Feature unavailable",
          empty(
            "This flow is not connected yet",
            "Use your catalog, payment setup or Account. Design previews remain available separately.",
            link("Go home", "home", "primary"),
          ),
        );
  }

  async function loadCore() {
    if (state.coreLoading) return;
    const turn = generation;
    state.coreLoading = true;
    const errors = [];
    const jobs = [];
    if (can("sales.allocate"))
      jobs.push(
        api
          .pages("/payments?status=SUCCEEDED")
          .then((rows) => {
            if (turn === generation) state.payments = rows;
          })
          .catch((error) => errors.push("Pending payments: " + message(error))),
      );
    if (can("reports.view")) {
      jobs.push(
        api
          .request("/dashboard/summary")
          .then((data) => {
            if (turn === generation) state.summary = data;
          })
          .catch((error) => errors.push("Sales summary: " + message(error))),
      );
      jobs.push(
        api
          .pages("/reports/sales")
          .then((rows) => {
            if (turn === generation) state.sales = rows;
          })
          .catch((error) => errors.push("Recorded sales: " + message(error))),
      );
    }
    await Promise.all(jobs);
    if (turn === generation) {
      state.coreErrors = errors;
      state.coreLoading = false;
    }
  }
  function dashboard() {
    return (
      (state.coreErrors.length
        ? notice(state.coreErrors.map(esc).join("<br>"), "warning")
        : "") +
      (state.summary
        ? `<section><div class="section-title"><h2>Today’s sales</h2>${link("View sales", "sales", "text-btn")}</div><div class="card daily"><strong class="money-lg">${formatMinor(state.summary.revenue)}</strong><div class="daily-details"><span>${state.summary.salesCount} sales</span><span class="profit"><strong>${formatMinor(state.summary.margin)}</strong>Profit</span></div></div></section>`
        : "") +
      (can("sales.allocate")
        ? `<section><div class="section-title"><h2>Pending payments</h2><button class="text-btn" data-live="refresh-core">Refresh</button></div>${paymentRows(state.payments.slice(0, 3))}</section>`
        : "")
    );
  }
  function paymentRows(rows) {
    return rows.length
      ? `<div class="card">${rows.map((p) => `<button class="list-link" data-live="begin-match" data-id="${esc(p.id)}"><span class="payment-method">${ico("homeTransfer")}</span><div class="grow"><strong>${formatMinor(p.amountMinor)}</strong><p>${esc(p.channel || p.provider || "Payment")} · ${esc(p.reference || "")}</p></div>${ico("caret")}</button>`).join("")}</div>`
      : empty(
          "No pending payments",
          "Confirmed payments waiting for products will appear here.",
        );
  }
  function salesScreen() {
    return shell(
      "Sales",
      `<div class="stack"><div class="between"><h2>Pending payments</h2><button class="secondary" data-live="refresh-core">Refresh</button></div>${state.coreErrors.map((e) => notice(esc(e), "warning")).join("")}${paymentRows(state.payments)}${can("reports.view") ? `<h2>Recorded sales</h2><div class="card">${state.sales.length ? state.sales.map((s) => `<div class="list-link"><div class="grow"><strong>${formatMinor(s.total)}</strong><p>${esc(s.createdAt ? new Date(s.createdAt).toLocaleString() : "")} · ${s.items?.length || 0} products</p></div>${s.flagged ? status("Review difference", "warn") : status("Recorded", "good")}</div>`).join("") : empty("No recorded sales", "Confirmed sales will appear here.")}</div>` : ""}</div>`,
    );
  }
  function selectedItems() {
    return Object.entries(state.quantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({
        product: state.products.find((p) => p.id === id),
        qty,
      }))
      .filter((x) => x.product);
  }
  function matchScreen() {
    const p = state.payments.find((p) => p.id === state.paymentId);
    if (!p)
      return shell(
        "Record sale",
        empty(
          "Choose a payment",
          "Select a pending payment to record what was sold.",
          link("Pending payments", "sales", "primary"),
        ),
      );
    const items = selectedItems(),
      total = items.reduce(
        (sum, item) => sum + BigInt(item.product.price) * BigInt(item.qty),
        0n,
      ),
      difference = BigInt(p.amountMinor) - total;
    return shell(
      "What did you sell?",
      `<div class="selection-grid"><section class="card pad stack-sm"><div class="payment-summary"><strong class="money-lg">${formatMinor(p.amountMinor)}</strong><p class="caption muted">${esc(p.reference || "Confirmed payment")}</p></div><div class="product-picker">${state.products
        .filter((p) => p.active !== false)
        .map(
          (p) =>
            `<div class="pick-card ${state.quantities[p.id] ? "selected" : ""}"><div class="grow"><h3>${esc(p.name)}</h3><span class="caption">${formatMinor(p.price)}</span></div><div class="quantity"><button data-live="live-quantity" data-id="${esc(p.id)}" data-delta="-1" aria-label="Remove one ${esc(p.name)}" ${state.allocating ? "disabled" : ""}>−</button><strong>${state.quantities[p.id] || 0}</strong><button data-live="live-quantity" data-id="${esc(p.id)}" data-delta="1" aria-label="Add one ${esc(p.name)}" ${state.allocating ? "disabled" : ""}>+</button></div></div>`,
        )
        .join(
          "",
        )}</div></section><section class="card pad stack-sm"><h2>Review sale</h2>${kv("Products total", formatMinor(total))}${kv("Paid", formatMinor(p.amountMinor))}${difference !== 0n ? notice("Difference: " + formatMinor(difference) + ". Discounts and tips are allowed. The server records and flags the variance.", "warning") : notice("Matches the payment.")}<p class="form-error" id="allocate-error" role="alert"></p><button class="primary" data-live="allocate" ${!items.length || state.allocating ? "disabled" : ""}>${state.allocating ? "Confirming…" : "Confirm sale"}</button><p class="small muted">The server updates stock when the sale is confirmed. Negative stock is allowed and flagged.</p></section></div>`,
      { back: "sales" },
    );
  }
  async function allocate() {
    if (state.allocating || !can("sales.allocate")) return;
    const items = selectedItems();
    if (!items.length) return;
    state.saleKey ||= crypto.randomUUID();
    state.allocating = true;
    rerender();
    try {
      const sale = await api.request(
        "/payments/" + encodeURIComponent(state.paymentId) + "/match",
        {
          method: "POST",
          body: {
            items: items.map((i) => ({ productId: i.product.id, qty: i.qty })),
            idempotencyKey: state.saleKey,
          },
        },
      );
      await loadCore();
      state.quantities = {};
      state.saleKey = null;
      go("sales", true);
      toast("Sale recorded · " + formatMinor(sale.total));
    } catch (error) {
      if (error.status === 409) {
        await loadCore();
        go("sales", true);
        toast(
          "This payment was already matched. The queue has been refreshed.",
        );
      } else {
        rerender();
        const node = $("#allocate-error");
        if (node)
          node.textContent =
            message(error) + " Retry uses the same request key.";
      }
    } finally {
      state.allocating = false;
      const button = $("[data-live=allocate]");
      if (button) {
        button.disabled = false;
        button.textContent = "Confirm sale";
      }
    }
  }

  function valid(form) {
    let ok = true;
    form.querySelectorAll("[data-error]").forEach((x) => (x.textContent = ""));
    for (const input of form.querySelectorAll("input,select")) {
      if (!input.checkValidity()) {
        const target = form.querySelector(`[data-error="${input.name}"]`);
        if (target)
          target.textContent = input.validity.valueMissing
            ? "This field is required."
            : input.validationMessage;
        ok = false;
      }
    }
    if (!ok) form.querySelector(":invalid")?.focus();
    return ok;
  }
  function setError(form, error) {
    const target = $("#live-error", form) || $("#import-error");
    if (target) target.textContent = message(error);
    else notifyError(error);
  }
  async function busy(form, work) {
    if (state.submitting) return;
    state.submitting = true;
    form
      .querySelectorAll("button[type=submit]")
      .forEach((x) => (x.disabled = true));
    try {
      await work();
    } catch (error) {
      setError(form, error);
    } finally {
      state.submitting = false;
      if (form.isConnected)
        form
          .querySelectorAll("button[type=submit]")
          .forEach((x) => (x.disabled = false));
    }
  }
  async function importFile(file) {
    state.csv = null;
    state.result = null;
    state.csvText = "";
    if (!file) return;
    if (file.size > MAX_CSV_BYTES)
      throw new Error("Choose a CSV smaller than 2 MB.");
    if (!/\.csv$/i.test(file.name))
      throw new Error("Export your spreadsheet as a .csv file first.");
    state.csvText = await file.text();
    state.fileName = file.name;
    state.csv = prepareImport(state.csvText, state.units);
    rerender();
  }
  document.addEventListener("change", async (event) => {
    const el = event.target;
    try {
      if (el.id === "live-csv") await importFile(el.files?.[0]);
      if (el.id === "live-units") {
        state.units = el.value;
        state.result = null;
        state.csv = null;
        if (state.csvText)
          state.csv = prepareImport(state.csvText, state.units);
        rerender();
      }
    } catch (error) {
      const target = $("#import-error");
      if (target) target.textContent = error.message;
    }
  });
  document.addEventListener("input", (event) => {
    if (event.target.id === "live-search") {
      $("#live-catalog").innerHTML = catalogRows(
        state.products.filter(
          (p) =>
            p.active !== false &&
            p.name.toLowerCase().includes(event.target.value.toLowerCase()),
        ),
      );
    }
  });
  document.addEventListener("click", async (event) => {
    const scroll = event.target.closest("[data-scroll]");
    if (scroll) {
      event.preventDefault();
      document
        .getElementById(scroll.dataset.scroll)
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (event.target.closest("[data-action=close]")) {
      closeModal();
      return;
    }
    const b = event.target.closest("[data-live]");
    if (!b || b.disabled) return;
    const action = b.dataset.live;
    try {
      if (action === "refresh-core") {
        await loadCore();
        rerender();
        return;
      }
      if (action === "begin-match") {
        state.paymentId = b.dataset.id;
        state.quantities = {};
        state.saleKey = null;
        return go("match-payment");
      }
      if (action === "live-quantity") {
        if (state.allocating) return;
        state.quantities[b.dataset.id] = Math.max(
          0,
          Math.min(
            999,
            (state.quantities[b.dataset.id] || 0) + Number(b.dataset.delta),
          ),
        );
        state.saleKey = null;
        rerender();
        return;
      }
      if (action === "allocate") return allocate();
      if (action === "go") return go(b.dataset.to);
      if (action === "retry") return initialize();
      if (action === "push-later") {
        sessionStorage.setItem("invent-push-later-" + api.session?.userId, "1");
        closeModal();
        return;
      }
      if (action === "push-prepare") {
        b.disabled = true;
        await prepareNotifications();
        return;
      }
      if (action === "push-enable") {
        b.disabled = true;
        try {
          await push.enable();
          state.enabled = true;
          sessionStorage.setItem(
            "invent-push-later-" + api.session.userId,
            "1",
          );
          closeModal();
          toast("Notifications enabled");
        } finally {
          b.disabled = false;
          rerender();
        }
        return;
      }
      if (action === "push-disable") {
        b.disabled = true;
        try {
          await push.disable();
          state.enabled = false;
          toast("Notifications turned off");
        } finally {
          b.disabled = false;
          rerender();
        }
        return;
      }
      if (action === "logout") {
        b.disabled = true;
        generation++;
        try {
          await push.disable().catch(() => {});
          await api.logout();
        } finally {
          api.clear();
          state.loading = false;
          state.coreLoading = false;
          state.tenant = null;
          state.profile = null;
          state.products = [];
          state.payments = [];
          state.sales = [];
          state.summary = null;
          state.managed = null;
          state.initialized = false;
          state.enabled = false;
          closeModal();
          go("login", true);
        }
        return;
      }
      if (action === "refresh-products") {
        b.disabled = true;
        await loadProducts();
        rerender();
        return;
      }
      if (action === "refresh-account") {
        b.disabled = true;
        await loadManaged();
        rerender();
        return;
      }
      if (action === "import-submit") {
        if (!can("catalog.write") || !state.csv || state.importing) return;
        const csv = state.csv.csv;
        state.importing = true;
        state.result = null;
        rerender();
        try {
          const result = await api.request("/products/import", {
            method: "POST",
            body: { csv },
          });
          if (
            !Number.isInteger(result?.created) ||
            !Number.isInteger(result.updated) ||
            !Number.isInteger(result.skipped) ||
            !Array.isArray(result.errors)
          )
            throw new Error(
              "The server returned an unexpected import result. Check the catalog before retrying.",
            );
          state.result = result;
          state.csv = null;
          state.csvText = "";
          await loadProducts();
        } catch (error) {
          state.csv = null;
          state.csvText = "";
          state.result = null;
          state.importError =
            message(error) +
            " Check the catalog before choosing the file again; the server may have processed some rows.";
        } finally {
          state.importing = false;
          rerender();
          if (state.importError) {
            $("#import-error").textContent = state.importError;
            state.importError = "";
          }
        }
        return;
      }
    } catch (error) {
      notifyError(error);
      if (b.isConnected) b.disabled = false;
    }
  });
  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!form.id.startsWith("live-")) return;
    event.preventDefault();
    if (!valid(form)) return;
    const data = Object.fromEntries(new FormData(form));
    await busy(form, async () => {
      if (form.id === "live-auth") {
        const kind = form.dataset.kind;
        if (kind === "forgot") {
          await api.request("/auth/forgot-password", {
            method: "POST",
            body: { email: data.email },
            auth: false,
          });
          form.reset();
          go("check", true);
          return;
        }
        if (kind === "reset") {
          const token = new URLSearchParams(location.hash.split("?")[1]).get(
            "token",
          );
          if (!token)
            throw new Error(
              "This reset link is missing its token. Request a new reset link.",
            );
          if (data.password !== data.confirm)
            throw new Error("Passwords don’t match.");
          await api.request("/auth/reset-password", {
            method: "POST",
            body: { token, password: data.password },
            auth: false,
          });
          form.reset();
          go("login", true);
          toast("Password updated. Log in with your new password.");
          return;
        }
        await push.disable().catch(() => {});
        const payload =
          kind === "create"
            ? {
                name: data.name.trim(),
                businessName: data.businessName.trim(),
                email: data.email.trim(),
                password: data.password,
              }
            : { email: data.email.trim(), password: data.password };
        await api.authenticate(
          kind === "create" ? "register" : "login",
          payload,
        );
        generation++;
        clearData();
        state.profile = {
          name: data.name?.trim() || "Your account",
          email: data.email.trim(),
        };
        form.reset();
        state.initialized = false;
        state.tenant = null;
        state.error = "";
        state.pushReady = false;
        state.prompting = false;
        state.loading = false;
        state.coreLoading = false;
        go(kind === "create" ? "onboarding" : "home", true);
        await initialize();
        return;
      }
      if (form.id === "live-product") {
        if (!can("catalog.write"))
          throw new Error("You don’t have permission to edit the catalog.");
        const payload = {
          name: data.name.trim(),
          price: safeMinorNumber(nairaToMinor(data.price)),
          cost: safeMinorNumber(nairaToMinor(data.cost)),
          ...(data.sku ? { sku: data.sku.trim() } : {}),
        };
        await api.request(
          "/products" +
            (form.dataset.id ? "/" + encodeURIComponent(form.dataset.id) : ""),
          { method: form.dataset.id ? "PATCH" : "POST", body: payload },
        );
        await loadProducts();
        go("products", true);
        toast("Product saved");
        return;
      }
      if (form.id === "live-managed") {
        if (!can("payments.manage"))
          throw new Error(
            "You don’t have permission to set up payment accounts.",
          );
        if (data.ownerConsent !== "on")
          throw new Error(
            "Confirm that you’re authorized to submit these details.",
          );
        const payload = {
          businessName: data.businessName.trim(),
          ownerName: data.ownerName.trim(),
          ownerEmail: data.ownerEmail.trim(),
          customerFirstName: data.customerFirstName.trim(),
          customerLastName: data.customerLastName.trim(),
          settlementBankCode: data.settlementBankCode.trim(),
          settlementAccountNumber: data.settlementAccountNumber.trim(),
          ownerConsent: true,
          ...(data.ownerPhone ? { ownerPhone: data.ownerPhone.trim() } : {}),
        };
        state.managed = await api.request("/payments/managed-account", {
          method: "POST",
          body: payload,
        });
        form.reset();
        await loadManaged();
        go("onboarding", true);
        toast("Payment account setup submitted. Review its status below.");
        return;
      }
    });
  });
  return { render, api };
}
