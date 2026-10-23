import { recordSale, voidSale, cancelWithdrawal } from "./model.js";
import {
  readData,
  saveData,
  initialData,
  permissionDefinitions,
  money,
  profit,
  stockStatus,
} from "./data.js";
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)],
  esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
let db = readData(),
  role = sessionStorage.getItem("invent-role") || "owner",
  route = "",
  params = new URLSearchParams(),
  view = "pending",
  productFilter = "All",
  search = "",
  sort = "oldest",
  period = "Today",
  walletFilter = "All",
  selectedSale = "p4",
  draft = null,
  photo = null,
  dirty = false,
  permissionDraft = null,
  modalFocus = null,
  toastTimer;
const isOwner = () => role === "owner",
  allowed = (k) => isOwner() || !!db.staff?.permissions.includes(k),
  pending = () => db.payments.filter((p) => p.status === "pending"),
  who = () => (isOwner() ? db.owner : db.staff || { name: "Staff", email: "" }),
  initials = (n) =>
    n
      .split(" ")
      .slice(0, 2)
      .map((x) => x[0])
      .join("")
      .toUpperCase(),
  product = (id) => db.products.find((p) => p.id === id),
  payment = (id) => db.payments.find((p) => p.id === id);
const ico = (n) =>
    `<span class="icon" aria-hidden="true"><img src="assets/${n}.svg" alt=""></span>`,
  brand = () =>
    `<span class="brand"><span class="brand-mark">${ico("logo")}</span><span>Invent IO</span></span>`,
  btn = (l, a, c = "primary", e = "") =>
    `<button class="${c}" data-action="${a}" ${e}>${l}</button>`,
  link = (l, to, c = "text-btn") => `<a class="${c}" href="#/${to}">${l}</a>`,
  status = (l, k = "") =>
    `<span class="status ${k}">${l === "Over a day old" ? ico("homeWarning") : l === "Recorded" ? ico("recordedStatus") : l === "Pending" ? ico("pendingStatus") : ""}${esc(l)}</span>`,
  notice = (c, k = "") =>
    `<div class="notice ${k}">${ico("info")}<div>${c}</div></div>`,
  kv = (l, v) => `<div class="kv"><span>${l}</span><strong>${v}</strong></div>`;
const field = (n, l, v = "", t = "text", h = "", a = "") =>
    `<label class="field">${l}<input name="${n}" type="${t}" value="${esc(v)}" ${a}>${h ? `<span class="hint">${h}</span>` : ""}<span class="error" data-error="${n}"></span></label>`,
  empty = (t, c, a = "") =>
    `<div class="empty">${ico("package")}<h2>${t}</h2><p>${c}</p>${a}</div>`,
  thumb = (p) =>
    p.image
      ? `<img class="product-thumb" src="${esc(p.image)}" alt="${esc(p.name)}">`
      : `<span class="product-placeholder">${ico("package")}</span>`;
function save() {
  if (!saveData(db))
    toast("Changes could not be saved in this browser. Keep this tab open.");
}
function toast(t) {
  clearTimeout(toastTimer);
  $("#toast").textContent = t;
  $("#toast").classList.add("show");
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4500);
}
function go(to, force = false) {
  if (dirty && !force) {
    confirmDialog(
      "Leave without saving?",
      "Your changes haven’t been saved.",
      () => {
        dirty = false;
        go(to, true);
      },
      "Leave without saving",
    );
    return;
  }
  if (location.hash === "#/" + to) render();
  else location.hash = "/" + to;
}
function setRole(v) {
  role = v;
  sessionStorage.setItem("invent-role", v);
}
function sidebar(active) {
  return `<aside class="sidebar"><a href="#/welcome" class="sidebar-brand">${brand()}<p>${esc(db.business.name)}</p></a><nav class="side-nav" aria-label="Main navigation">${[["home", "Home", "navHome"], ["sales", "Sales", "navSales"], ...(allowed("inventory") ? [["products", isOwner() ? "Products" : "Stock", "navProducts"]] : [])].map(([id, l, i]) => `<a href="#/${id}" title="${l}" class="${active === id ? "active" : ""}">${ico(i)}<span class="nav-label">${l}</span>${id === "sales" && pending().length ? `<span class="nav-count">${pending().length}</span>` : ""}</a>`).join("")}${
    isOwner()
      ? `<span class="side-heading">MORE</span>${[
          ["weekly", "Weekly summary", "navWeekly"],
          ["team", "Team", "navTeam"],
          ["settings", "Business settings", "navSettings"],
        ]
          .map(
            ([id, l, i]) =>
              `<a href="#/${id}" title="${l}" class="${active === id ? "active" : ""}">${ico(i)}<span class="nav-label">${l}</span></a>`,
          )
          .join("")}`
      : ""
  }</nav><a href="#/account" class="account-link" title="Account"><span class="avatar">${initials(who().name)}</span><div><strong>${esc(who().name)}</strong><small>${isOwner() ? "Owner" : "Staff"} · Account</small></div></a></aside>`;
}
function bottomNav(active) {
  return `<nav class="bottom-nav" aria-label="Main navigation">${[["home", "Home", "home"], ["sales", "Sales", "homeSales"], ...(allowed("inventory") ? [["products", isOwner() ? "Products" : "Stock", "homeProducts"]] : []), ["more", "More", "homeMore"]].map(([id, l, i]) => `<a href="#/${id}" class="${active === id ? "active" : ""}" ${active === id ? 'aria-current="page"' : ""}><span class="bottom-icon">${ico(active === "home" && id === "home" ? "homeActive" : i)}${id === "sales" && pending().length ? `<span class="bottom-badge">${pending().length}</span>` : ""}</span>${l}</a>`).join("")}</nav>`;
}
function shell(
  title,
  body,
  {
    active = route,
    subtitle = "",
    back = "",
    actions = "",
    root = false,
    cls = "",
    tabs = true,
    fab = false,
    home = false,
  } = {},
) {
  document.title = `${title} · Invent IO`;
  return `${sidebar(active)}<div class="workspace"><header class="topbar ${root ? "root-header" : ""} ${home ? "home-header" : ""}"><div class="title-group">${back ? `<button class="icon-btn" data-go="${back}" aria-label="Back">${ico("back")}</button>` : ""}<div><h1>${home ? `<span class="desktop-only">Home</span><span class="mobile-only">${esc(db.business.name)}</span>` : esc(title)}</h1>${subtitle ? `<p>${subtitle}</p>` : ""}</div></div><div class="header-actions">${actions}</div>${home ? `<a href="#/account" class="avatar mobile-only" aria-label="Account">${initials(who().name)}</a>` : ""}</header><main class="content ${cls}" id="main">${body}</main></div>${tabs ? bottomNav(active) : ""}${fab && allowed("record") ? `<button class="fab" data-action="record">${ico("homePlus")}Record payment</button>` : ""}`;
}
const recordBtn = () =>
  allowed("record") ? btn(ico("add") + "Record payment", "record") : "";
function balanceCard() {
  return `<div class="card balance"><button class="full" data-go="wallet" style="text-align:left;padding:0"><span class="caption muted">Available balance</span><div class="money-xl">${money(db.balance)}</div></button><p class="ready">Ready to withdraw now</p><div class="balance-footer"><div class="between"><span class="muted"><span class="desktop-only">Total received (all time)</span><span class="mobile-only">Total received</span></span><strong>${money(db.totalReceived)}</strong></div>${btn("Withdraw", "withdraw")}</div></div>`;
}
function summary() {
  const s = db.payments.filter((p) => p.status === "recorded");
  return {
    amount: db.earlier.amount + s.reduce((a, p) => a + p.amount, 0),
    count: db.earlier.count + s.length,
    profit: db.earlier.profit + s.reduce((a, p) => a + (profit(p) || 0), 0),
    missing: db.earlier.missing + s.filter((p) => profit(p) == null).length,
  };
}
function homeBody() {
  const s = summary(),
    mine = db.payments.filter(
      (p) => p.status === "recorded" && p.by === "Bisi",
    );
  return `<div class="home-grid">${isOwner() && db.business.collection ? `<section><div class="section-title"><h2>Wallet</h2></div>${balanceCard()}<p class="wallet-info">${ico("info")}Simulated · test mode, no real money moves</p></section>` : ""}<section><div class="section-title"><h2>${isOwner() ? "Today’s sales" : "My sales today"}</h2>${btn("View sales", "view-recorded", "")}</div><div class="card daily"><div class="money-lg">${money(isOwner() ? s.amount : mine.reduce((a, p) => a + p.amount, 0))}</div><div class="daily-details"><span class="caption muted">${isOwner() ? s.count : mine.length} sales</span>${isOwner() ? `<span class="profit"><strong>${money(s.profit)}</strong>Profit</span>` : ""}</div>${isOwner() ? `<p class="small muted">Profit counts ${s.count - s.missing} of ${s.count} sales · ${s.missing} has no cost price</p>` : ""}</div></section></div><section class="pending-section"><div class="section-title"><h2>Pending payments</h2>${btn(`View all (${pending().length})`, "view-pending", "")}</div>${pending().length ? pendingTable(true) : empty("No pending payments", "New payments will appear here.")}<p class="table-note desktop-only">Select a row to record what was sold. Pending payments don’t count in sales until products are recorded.</p></section>`;
}
function paymentRow(p, a = "open-payment") {
  return `<button class="payment-row" data-action="${a}" data-id="${p.id}"><span class="payment-method">${ico(p.method === "Transfer" ? "homeTransfer" : "homeCash")}</span><span class="payment-copy"><strong>${money(p.amount)}</strong><span>${esc(p.method)} · ${esc(p.customer || (p.by === "Bisi" ? "by Bisi" : ""))}${p.customer || p.by === "Bisi" ? " · " : ""}${esc(p.age)}</span>${p.note ? `<span class="note">${esc(p.note)}</span>` : ""}</span>${p.old ? status("Over a day old", "warn") : p.status === "voided" ? status("Voided", "neutral") : ""}${ico("homeChevron")}</button>`;
}
function pendingTable(home = false) {
  const list = pending()
    .slice()
    .sort((a, b) =>
      sort === "oldest"
        ? db.payments.indexOf(a) - db.payments.indexOf(b)
        : db.payments.indexOf(b) - db.payments.indexOf(a),
    );
  return `<div class="card table-wrap"><table class="data-table"><thead><tr><th>Amount</th><th>How they paid</th><th>Customer / received by</th><th>Received</th><th>Note</th><th></th></tr></thead><tbody>${list.map((p) => `<tr data-action="open-payment" data-id="${p.id}" tabindex="0" role="button" aria-label="Open ${money(p.amount)} payment"><td><strong>${money(p.amount)}</strong></td><td>${esc(p.method)}${p.provider ? " · " + esc(p.provider) : ""}</td><td>${esc(p.customer || (p.by === "Bisi" ? "by Bisi" : "—"))}</td><td>${esc(p.age)}</td><td class="note-cell">${p.old ? status("Over a day old", "warn") : esc(p.note || "")}</td><td>${home ? ico("caret") : allowed("record") ? btn("＋ What did you sell?", "open-payment", "secondary compact", `data-id="${p.id}"`) : ico("caret")}</td></tr>`).join("")}</tbody></table></div><div class="card payment-list">${(home ? list.slice(0, 2) : list).map((p) => paymentRow(p)).join("")}</div>`;
}
function homeScreen() {
  if (!db.staff && !isOwner()) return noBusiness();
  return shell("Home", homeBody(), {
    active: "home",
    subtitle: `<span class="desktop-only">${esc(db.business.name)} · </span>Sat 3 Oct`,
    actions: recordBtn(),
    root: true,
    home: true,
    cls: "home-content",
    fab: true,
  });
}
function salesScreen() {
  let rows = db.payments.filter((p) =>
    view === "recorded"
      ? ["recorded", "voided"].includes(p.status)
      : p.status === "excluded",
  );
  if (!isOwner() && view === "recorded")
    rows = rows.filter((p) => p.by === "Bisi");
  if (view === "recorded" && period !== "This week")
    rows = rows.filter(
      (p) =>
        p.date ===
        (period === "Yesterday"
          ? "2026-10-02"
          : period === "Today"
            ? "2026-10-03"
            : period),
    );
  const s = summary();
  const toolbar = `<div class="toolbar sales-toolbar"><div class="chips">${[
    ["pending", `Pending payments (${pending().length})`],
    ["recorded", isOwner() ? "Recorded" : "My sales"],
    ["excluded", "Not a sale"],
  ]
    .map(([id, l]) =>
      btn(
        (view === id ? ico("tick") : "") + l,
        "sales-view",
        `pill ${view === id ? "active" : ""}`,
        `data-value="${id}"`,
      ),
    )
    .join(
      "",
    )}</div>${view === "pending" ? `<div class="row sort-toolbar"><span class="small muted">Sort</span>${["oldest", "newest"].map((v) => btn((sort === v ? ico("tick") : "") + (v === "oldest" ? "Oldest first" : "Newest first"), "sort", `pill ${sort === v ? "active" : ""}`, `data-value="${v}"`)).join("")}</div>` : view === "recorded" ? `<div class="chips">${["Today", "Yesterday", "This week", "Pick a date"].map((v) => btn(v, "period", `pill ${period === v ? "active" : ""}`, `data-value="${v}"`)).join("")}</div>` : ""}</div>`;
  let body;
  if (view === "pending")
    body = pending().length
      ? pendingTable() +
        `<p class="table-note">Oldest first so nothing is missed. Pending payments don’t count in sales until products are recorded.</p>`
      : empty(
          "No pending payments",
          "You’re all caught up. New payments will appear here.",
          recordBtn(),
        );
  else if (view === "excluded")
    body = rows.length
      ? `<div class="card table-wrap"><table class="data-table"><thead><tr><th>Amount</th><th>How they paid</th><th>Customer / received by</th><th>Received</th><th></th></tr></thead><tbody>${rows.map((p) => `<tr><td><strong>${money(p.amount)}</strong></td><td>${esc(p.method)}</td><td>${esc(p.customer || "by " + p.by)}</td><td>${esc(p.age)}</td><td>${btn("Restore", "restore", "secondary compact", `data-id="${p.id}"`)}</td></tr>`).join("")}</tbody></table></div><div class="card payment-list">${rows.map((p) => paymentRow(p, "restore")).join("")}</div><p class="table-note">These payments don’t count in sales. Restore a payment if products need to be recorded.</p>`
      : empty(
          "No payments marked Not a sale",
          "Payments you mark Not a sale will appear here.",
        );
  else
    body = rows.length
      ? `<div class="master-detail"><div class="card"><button class="recorded-summary full" data-go="sales-summary" style="text-align:left"><strong>${esc(period)} · ${money(isOwner() && period === "Today" ? s.amount : rows.filter((p) => p.status === "recorded").reduce((a, p) => a + p.amount, 0))} · ${isOwner() && period === "Today" ? s.count : rows.filter((p) => p.status === "recorded").length} sales</strong><p>Top products: Shea butter · Black soap · Body lotion</p></button><div class="table-wrap"><table class="data-table"><thead><tr><th>Amount</th><th>Paid</th><th>Items</th><th>Time</th><th>By</th><th>Status</th></tr></thead><tbody>${rows.map((p) => `<tr data-action="sale-detail" data-id="${p.id}" tabindex="0" role="button"><td><strong>${money(p.amount)}</strong></td><td>${p.method}</td><td class="note-cell">${p.items?.map((i) => esc(i.name) + " × " + i.quantity).join(", ")}</td><td>${p.age.replace("Today ", "")}</td><td>${esc(p.by)}</td><td>${status(p.status === "voided" ? "Voided" : "Recorded", p.status === "voided" ? "neutral" : "good")}</td></tr>`).join("")}</tbody></table></div><div class="payment-list">${rows.map((p) => paymentRow(p, "sale-detail")).join("")}</div></div>${saleDetail(payment(selectedSale) || rows[0], true)}</div>`
      : empty(
          "No sales for this date",
          "Recorded sales will appear here. Try another date.",
        );
  return shell("Sales", toolbar + body, {
    actions: recordBtn(),
    active: "sales",
    root: true,
    fab: true,
  });
}
function saleDetail(p, panel = false) {
  if (!p)
    return empty("Sale not found", "This sample sale is no longer available.");
  if (!isOwner() && p.by !== "Bisi")
    return empty(
      "You don’t have access",
      "Staff can only view their own recorded sales.",
    );
  const value = profit(p);
  return `<section class="card sale-detail">${panel ? '<div class="between"><h2>Sale detail</h2>' + btn("×", "close-detail", "icon-btn", 'aria-label="Close sale detail"') + "</div>" : ""}<div class="sale-hero"><div class="money-xl">${money(p.amount)}</div>${status(p.status === "voided" ? "Voided" : "Recorded", p.status === "voided" ? "neutral" : "good")}<p class="caption muted">${esc(p.method)}${p.customer ? " · " + esc(p.customer) : ""} · ${esc(p.age)} · by ${esc(p.by)}</p></div><div class="card">${(p.items || []).map((i) => `<div class="line-item">${thumb(product(i.id) || i)}<div class="grow"><strong>${esc(i.name)}</strong><small>${money(i.price)} × ${i.quantity}</small></div><strong class="caption">${money(i.price * i.quantity)}</strong></div>`).join("")}<div class="line-item between"><strong>Total</strong><strong>${money(p.amount)}</strong></div></div>${isOwner() ? `<div class="profit-card between"><span class="caption muted">Profit</span><strong>${value == null ? "Not available" : money(value)}</strong></div>${value == null ? '<p class="small muted">A product has no cost price. Profit is not available for this sale.</p>' : ""}` : ""}${p.status === "voided" ? notice("This sale was voided. Stock has been returned and it no longer counts in sales.") : allowed("record") ? btn("Void sale", "void", "text-btn danger", `data-id="${p.id}"`) : ""}</section>`;
}
function stockLabel(p) {
  const [t, k] = stockStatus(p);
  return `<span class="stock-label ${k === "bad" ? "danger" : k ? "" : "muted"}" ${k === "warn" ? 'style="color:#b45309"' : ""}>${ico(p.stock < 0 ? "stockCount" : p.stock === 0 ? "stockOut" : p.stock <= p.alert ? "stockLow" : "stockIn")}${esc(t)}</span>`;
}
function filteredProducts() {
  return db.products
    .filter((p) => (productFilter === "Archived" ? p.archived : !p.archived))
    .filter((p) =>
      productFilter === "Low"
        ? p.stock > 0 && p.stock <= p.alert
        : productFilter === "Out"
          ? p.stock === 0
          : productFilter === "Check count"
            ? p.stock < 0
            : productFilter === "Cost not set"
              ? p.cost == null
              : true,
    )
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
}
function productsBody() {
  return `<div class="toolbar"><label class="search">${ico("search")}<input type="search" id="product-search" value="${esc(search)}" placeholder="Search products" aria-label="Search products"></label>${allowed("add") ? link(ico("addDark") + "Add product", "product-new", "secondary mobile-only") : ""}<div class="chips">${[
    "All",
    "Low",
    "Out",
    "Check count",
    ...(isOwner() || allowed("cost") ? ["Cost not set"] : []),
    "Archived",
  ]
    .map((v) => {
      const n = db.products.filter(
        (p) =>
          !p.archived &&
          (v === "Low"
            ? p.stock > 0 && p.stock <= p.alert
            : v === "Out"
              ? p.stock === 0
              : v === "Check count"
                ? p.stock < 0
                : v === "Cost not set"
                  ? p.cost == null
                  : false),
      ).length;
      return btn(
        (productFilter === v ? ico("tick") : "") +
          v +
          (n ? " (" + n + ")" : ""),
        "product-filter",
        `pill ${productFilter === v ? "active" : ""}`,
        `data-value="${v}"`,
      );
    })
    .join(
      "",
    )}</div></div><div id="product-results">${productResults(filteredProducts())}</div>`;
}
function productResults(rows) {
  return rows.length
    ? `<div class="card table-wrap"><table class="data-table"><thead><tr><th>Product</th><th>Selling price</th>${isOwner() || allowed("cost") ? "<th>Cost price</th>" : ""}<th>Stock</th><th class="tablet-hide">Note</th></tr></thead><tbody>${rows.map((p) => `<tr data-go="product?id=${p.id}" tabindex="0" role="button"><td><span class="row">${thumb(p)}<strong>${esc(p.name)}</strong></span></td><td>${money(p.price)}</td>${isOwner() || allowed("cost") ? `<td>${p.cost == null ? "—" : money(p.cost)}</td>` : ""}<td>${stockLabel(p)}</td><td class="tablet-hide">${p.cost == null && (isOwner() || allowed("cost")) ? status("Cost not set", "warn") : p.archived ? status("Archived", "neutral") : ""}</td></tr>`).join("")}</tbody></table></div><div class="card product-list">${rows.map((p) => `<a class="list-link" href="#/product?id=${p.id}">${thumb(p)}<div class="grow"><strong>${esc(p.name)}</strong><p>${money(p.price)}${isOwner() || allowed("cost") ? " · cost " + (p.cost == null ? "not set" : money(p.cost)) : ""}</p>${stockLabel(p)}</div>${ico("homeChevron")}</a>`).join("")}</div><p class="table-note desktop-only">Select a product to open it. Low = at or below its low-stock alert. Negative stock is allowed and shows “Check count”.</p>`
    : empty(
        search
          ? "No results"
          : productFilter === "All"
            ? "No products yet"
            : productFilter === "Low"
              ? "Nothing low"
              : "No products here",
        search
          ? "Try a different product name."
          : "Products matching this filter will appear here.",
        allowed("add") ? link("Add product", "product-new", "primary") : "",
      );
}
function productsScreen() {
  if (!allowed("inventory"))
    return restricted(
      "Stock",
      "Your owner hasn’t given you access to inventory.",
    );
  return shell(isOwner() ? "Products" : "Stock", productsBody(), {
    actions: allowed("add")
      ? link(ico("add") + "Add product", "product-new", "primary")
      : recordBtn(),
    active: "products",
    root: true,
    fab: true,
  });
}
function productScreen() {
  if (!allowed("inventory"))
    return restricted(
      "Stock",
      "Your owner hasn’t given you access to inventory.",
    );
  const p = product(params.get("id"));
  if (!p)
    return shell(
      "Product",
      empty("Product not found", "Choose a product from your list."),
      { back: "products", active: "products" },
    );
  return shell(
    p.name,
    `<div class="product-detail">${p.image ? `<img class="product-photo" src="${esc(p.image)}" alt="${esc(p.name)}">` : `<div class="product-photo placeholder">${ico("package")}</div>`}<div class="stack-sm"><div class="card pad"><p class="eyebrow">Stock</p><div class="money-lg" style="margin-top:8px">${p.stock} in stock</div>${p.stock <= p.alert ? `<p class="caption" style="margin-top:8px">${stockLabel(p)}</p>` : ""}${allowed("stock") && !p.archived ? `<div class="stock-actions">${btn(ico("addDark") + "Add received", "stock-add", "secondary", `data-id="${p.id}"`)}${btn("Correct count", "stock-correct", "secondary", `data-id="${p.id}"`)}</div>` : ""}</div><div class="card">${kv("Selling price", money(p.price))}${isOwner() || allowed("cost") ? kv("Cost price", p.cost == null ? "Not set" : money(p.cost)) : ""}${kv("Low-stock alert", "At " + p.alert + " or fewer left")}${kv("Last updated", esc(p.updated || "Today 9:15 · by Amaka"))}${kv("Added", "12 Aug 2026")}</div>${p.archived ? notice("This product is archived. It won’t appear when recording a sale.") + (allowed("edit") ? btn("Restore product", "product-restore", "secondary", `data-id="${p.id}"`) : "") : ""}</div></div>${!p.archived && ["edit", "price", "cost", "alert"].some(allowed) ? `<div class="sticky-actions mobile-only">${link("Edit product", "product-edit?id=" + p.id, "secondary")}</div>` : ""}`,
    {
      active: "products",
      back: "products",
      actions:
        !p.archived && ["edit", "price", "cost", "alert"].some(allowed)
          ? link("Edit product", "product-edit?id=" + p.id, "secondary")
          : "",
      tabs: false,
    },
  );
}
function editorScreen(onboard = false) {
  const editing = route === "product-edit",
    p = editing ? product(params.get("id")) : null;
  if (!allowed(editing ? "inventory" : "add"))
    return restricted(
      "Product",
      "Your permissions have changed. Ask your owner for access.",
    );
  if (editing && !p)
    return shell(
      "Product",
      empty("Product not found", "Choose a product from your list."),
      { back: "products" },
    );
  photo = p?.image || null;
  return shell(
    onboard
      ? "Add your first products"
      : editing
        ? "Edit product"
        : "Add product",
    `${onboard ? `<div class="section-title"><div><p class="eyebrow">Step 2 of 2</p><p class="caption muted">${db.products.length} products added. You can add the rest any time.</p></div></div>` : ""}<form id="product-form" class="card pad product-editor" novalidate><div class="photo-upload"><div class="photo-preview" id="photo-preview">${photo ? `<img src="${esc(photo)}" alt="Product photo">` : ico("addDark")}</div><div><h3>Product photo</h3><p class="caption muted">Optional. Helps staff find it quickly when selling.</p></div><label class="secondary compact" style="cursor:pointer">＋ Add photo<input type="file" id="product-photo" accept="image/png,image/jpeg,image/webp" class="hidden" ${editing && !allowed("edit") ? "disabled" : ""}></label></div><div><div class="form-grid">${field("name", "Product name", p?.name || "", "text", "", 'required maxlength="120" ' + (editing && !allowed("edit") ? "readonly" : ""))}${field("price", "Selling price (₦)", p?.price ?? "", "number", "", 'required min="0.01" step="0.01" ' + (editing && !allowed("price") ? "readonly" : ""))}${isOwner() || allowed("cost") ? field("cost", "Cost price (₦)", p?.cost ?? "", "number", "Optional. If you leave it blank, profit shows “Not available”", 'min="0" step="0.01"') : ""}${!editing ? field("stock", "Stock you have now", 0, "number", "", 'step="1" required') : ""}${field("alert", "Low-stock alert", p?.alert ?? 5, "number", "Shown as Low at this number or fewer", 'required min="0" step="1" ' + (editing && !allowed("alert") ? "readonly" : ""))}</div><p class="form-error" id="form-error"></p><div class="editor-actions"><button type="submit" name="intent" value="save" class="primary">Save</button>${!editing ? '<button type="submit" name="intent" value="another" class="secondary">Save & add another</button>' : allowed("edit") ? btn("Archive product", "archive", "text-btn danger", `data-id="${p.id}"`) : ""}${onboard ? link("I’ll add products later", "ready", "text-btn") : ""}</div></div></form>`,
    {
      active: "products",
      back: onboard ? "setup" : "products",
      tabs: false,
      cls: "medium product-edit-content has-double-actions",
    },
  );
}
function saleItems() {
  return Object.entries(draft?.quantities || {})
    .filter(([, q]) => q > 0)
    .map(([id, q]) => ({ ...product(id), quantity: q }));
}
const selectionTotal = () =>
  saleItems().reduce((s, i) => s + i.price * i.quantity, 0);
function selectionCard() {
  const p = payment(draft.paymentId),
    items = saleItems(),
    total = selectionTotal(),
    matches = Math.abs(total - p.amount) < 0.01,
    negative = items.filter((i) => i.stock - i.quantity < 0);
  return `<section class="card selection-review"><h2 class="desktop-only">Sale</h2><div class="payment-summary"><div class="between"><strong class="money-lg">${money(p.amount)}</strong>${status("Pending")}</div><p class="caption muted">${esc(p.method)}${p.customer ? " · " + esc(p.customer) : ""} · ${esc(p.age)}</p></div><div class="card">${items.length ? items.map((i) => `<div class="line-item"><div class="grow"><strong>${esc(i.name)}</strong><small>${money(i.price)} × ${i.quantity}</small></div><strong class="caption">${money(i.price * i.quantity)}</strong></div>`).join("") : '<p class="pad caption muted">Pick the products that were sold.</p>'}</div><div><div class="between caption"><strong>${money(total)} selected of ${money(p.amount)}</strong><span class="muted">${items.length} items</span></div><p class="caption ${matches ? "teal" : "muted"}" style="margin-top:8px">${matches ? "✓ Matches the payment" : items.length ? "The selected total differs from the payment." : "Select products to continue."}</p></div>${negative.length ? notice(`<strong>Check count after this sale</strong><p>${negative.map((i) => esc(i.name) + ": " + i.stock + " → " + (i.stock - i.quantity)).join("<br>")}</p>Selling is never blocked. Recount when you can.`, "warning") : ""}${!matches && items.length ? notice("The backend rules for payment differences are still being agreed. Use a matching total in this demo.", "warning") : ""}${btn("Confirm sale", "confirm-sale", "primary", !matches || !items.length ? "disabled" : "")}<p class="selection-note">Stock updates when you confirm. Only recorded sales count in your totals.</p></section>`;
}
function selectScreen(review = false) {
  if (!allowed("record"))
    return restricted("Record sale", "Your owner has turned off Record sales.");
  if (!draft || payment(draft.paymentId)?.status !== "pending")
    return shell(
      "What did you sell?",
      empty(
        "Choose a pending payment",
        "Open a payment to record its products.",
        link("Pending payments", "sales", "primary"),
      ),
      { active: "sales", back: "sales", tabs: false },
    );
  const p = payment(draft.paymentId),
    items = saleItems();
  return shell(
    review ? "Review sale" : "What did you sell?",
    review
      ? `<div class="desktop-only">${selectionCard()}</div>${mobileReview()}`
      : `<div class="selection-grid"><section class="card pad stack"><div class="mobile-only">${mobilePaymentCard(p)}</div><label class="search">${ico("search")}<input type="search" id="selection-search" placeholder="Search products" aria-label="Search products" value="${esc(search)}"></label><div class="between"><p class="eyebrow">Recent & top sellers</p>${allowed("add") ? link("Add product", "product-new", "text-btn small") : ""}</div><div class="product-picker" id="product-picker">${pickerProducts()}</div><p class="selection-note desktop-only">Tap a product to add it. You can sell more than the stock shown — we’ll mark it “Check count”.</p><div class="desktop-only">${btn("Save for later", "save-later", "text-btn")}${btn("Not a sale", "not-sale", "text-btn danger", `data-id="${p.id}"`)}</div><button class="selection-menu icon-btn mobile-only" data-action="payment-menu" aria-label="Payment options">⋮</button></section>${selectionCard()}</div><div class="selection-bottom"><div class="between"><strong>${money(selectionTotal())} selected of ${money(p.amount)}</strong><span>${items.length} items</span></div><p class="small ${selectionTotal() === p.amount ? "teal" : "muted"}">${selectionTotal() === p.amount ? "✓ Matches the payment" : "Pick the products that were sold."}</p>${btn("Review sale", "review-sale", "primary", items.length ? "" : "disabled")}</div>`,
    {
      active: "sales",
      back: review ? "select" : "sales",
      subtitle: `Payment ${money(p.amount)} · ${esc(p.method)}${p.customer ? " · " + esc(p.customer) : ""} · ${esc(p.age)}`,
      tabs: false,
      cls: review ? "narrow review-content" : "selection-content",
    },
  );
}
function pickerProducts() {
  const rows = db.products
    .slice()
    .sort(
      (a, b) =>
        (["shea", "soap", "lotion", "oil"].indexOf(a.id) < 0
          ? 99
          : ["shea", "soap", "lotion", "oil"].indexOf(a.id)) -
        (["shea", "soap", "lotion", "oil"].indexOf(b.id) < 0
          ? 99
          : ["shea", "soap", "lotion", "oil"].indexOf(b.id)),
    )
    .filter(
      (p) => !p.archived && p.name.toLowerCase().includes(search.toLowerCase()),
    );
  return rows.length
    ? rows
        .map((p) => {
          const q = draft.quantities[p.id] || 0;
          return `<div class="pick-card ${q ? "selected" : ""}">${thumb(p)}<button class="pick-copy" data-action="quantity" data-id="${p.id}" data-value="1" style="text-align:left"><strong>${esc(p.name)}</strong><span>${money(p.price)}</span><small>${allowed("inventory") ? esc(stockStatus(p)[0]) : ""}</small></button><span class="quantity">${q ? btn("−", "quantity", "", `data-id="${p.id}" data-value="-1" aria-label="Remove one ${esc(p.name)}"`) + `<strong>${q}</strong>` : ""}${btn(q ? "+" : "＋ Add", "quantity", "", `data-id="${p.id}" data-value="1" aria-label="Add one ${esc(p.name)}"`)}</span></div>`;
        })
        .join("")
    : empty("No products found", "Try another name.");
}
function transactionStatus(t) {
  return status(
    t.status,
    t.status === "Successful" || t.status === "Received"
      ? "good"
      : t.status === "Cancelled"
        ? "neutral"
        : t.status.startsWith("Failed")
          ? "bad"
          : t.status === "Pending"
            ? "warn"
            : "",
  );
}
function walletScreen(all = false) {
  if (!isOwner())
    return restricted("Wallet", "Only your owner can see the wallet.");
  const rows = db.transactions.filter(
    (t) =>
      walletFilter === "All" ||
      (walletFilter === "Customer payments"
        ? t.type === "payment"
        : t.type === "withdrawal"),
  );
  const table = `<div class="section-title"><h2>${all ? "Transactions" : "Recent transactions"}</h2>${all ? "" : link("See all", "transactions", "text-btn")}</div><div class="chips wallet-filters ${all ? "" : "desktop-only"}">${["All", "Customer payments", "Withdrawals"].map((v) => btn((walletFilter === v ? ico("tick") : "") + v, "wallet-filter", `pill ${walletFilter === v ? "active" : ""}`, `data-value="${v}"`)).join("")}</div>${rows.length ? `<div class="card table-wrap" style="margin-top:16px"><table class="data-table"><thead><tr><th>Type</th><th>Details</th><th>Amount</th><th>Status</th></tr></thead><tbody>${rows.map((t) => `<tr data-go="transaction?id=${t.id}" tabindex="0" role="button"><td>${t.type === "payment" ? "Customer payment" : "Withdrawal"}</td><td class="note-cell">${t.type === "payment" ? esc(t.customer) + " · " + t.method : "To " + esc(t.bank) + " •••• " + t.last4}<br>${esc(t.age)}</td><td><strong ${t.type === "payment" ? 'class="teal"' : ""}>${t.type === "payment" ? "+" : "−"}${money(t.amount)}</strong></td><td>${transactionStatus(t)}</td></tr>`).join("")}</tbody></table></div><div class="card transaction-list">${(all ? rows : rows.filter((t) => t.id !== "t2").slice(0, 3)).map((t) => `<a href="#/transaction?id=${t.id}" class="payment-row"><span class="payment-method">${ico(t.type === "payment" ? "homeTransfer" : "transfer")}</span><span class="payment-copy"><span class="between"><strong>${t.type === "payment" ? "Customer payment" : "Withdrawal"}</strong><strong ${t.type === "payment" ? 'style="color:#16703d"' : ""}>${t.type === "payment" ? "+" : "−"}${money(t.amount)}</strong></span><span>${t.type === "payment" ? esc(t.customer) + " · " + t.method : "To " + esc(t.bank) + " •••• " + t.last4} · ${esc(t.age)}</span>${t.type === "withdrawal" ? "<br>" + transactionStatus(t) : ""}</span>${ico("homeChevron")}</a>`).join("")}</div>` : empty("No transactions yet", "Customer payments and withdrawals will appear here.")}`;
  return shell(
    all ? "Transactions" : "Wallet",
    all
      ? table
      : `<div class="wallet-grid"><section>${balanceCard()}<p class="wallet-info desktop-only">${ico("info")}Simulated · test mode, no real money moves</p></section><section>${table}</section></div>`,
    {
      active: "home",
      back: all ? "wallet" : "home",
      subtitle: all
        ? ""
        : '<span class="desktop-only">Invent IO collection account</span>',
      tabs: false,
    },
  );
}
function transactionScreen() {
  if (!isOwner())
    return restricted("Wallet", "Only your owner can see the wallet.");
  const original = db.transactions.find((x) => x.id === params.get("id"));
  const t = original ? { ...original } : null;
  if (
    t &&
    [
      "Pending",
      "Waiting for funds",
      "Processing",
      "Successful",
      "Failed, funds returned",
      "Cancelled",
    ].includes(params.get("status"))
  )
    t.status = params.get("status");
  if (!t)
    return shell(
      "Transaction",
      empty("Transaction not found", "Choose a transaction from your wallet."),
      { back: "wallet", tabs: false },
    );
  const w = t.type === "withdrawal";
  return shell(
    w ? "Withdrawal" : "Payment received",
    `<div class="stack"><div class="sale-hero"><span class="money-xl">${money(t.amount)}</span>${transactionStatus(t)}<p class="caption muted">${esc(t.age)}</p></div><div class="card">${w ? kv("To", esc(t.bank) + " · " + esc(t.accountName || "Amaka Okafor") + " •••• " + t.last4) + kv("Withdrawal amount", money(t.amount)) + kv("Withdrawal fee", money(500)) + kv("Amount received", money(t.amount - 500)) : kv("Customer", esc(t.customer)) + kv("How they paid", t.method) + kv("Received", esc(t.age))}${kv("Reference", esc(t.id.toUpperCase()))}</div>${w ? notice(t.status === "Pending" ? "You can cancel while it’s Pending. Once it’s Processing, it can’t be stopped." : t.status === "Processing" ? "Your withdrawal is being processed. It can’t be cancelled now." : t.status === "Waiting for funds" ? "Your withdrawal will be sent when funds are available." : t.status === "Successful" ? "This simulated withdrawal was successful." : t.status.startsWith("Failed") ? "The withdrawal failed. The funds have been returned to your available balance." : "This withdrawal was cancelled. The funds are back in your available balance.") : ""}${w && ["Pending", "Waiting for funds"].includes(t.status) ? btn("Cancel withdrawal", "cancel-withdrawal", "secondary danger", `data-id="${t.id}"`) : !w ? btn("What did you sell?", "wallet-match", "primary", `data-id="${t.id}"`) : ""}<p class="small muted center">Simulated · test mode, no real money moves</p></div>`,
    { active: "home", back: "wallet", tabs: false, cls: "narrow" },
  );
}
function listLink(t, c, to) {
  return `<a class="list-link" href="#/${to}"><div class="grow"><strong>${t}</strong><p>${c}</p></div>${ico("homeChevron")}</a>`;
}
function moreScreen() {
  return shell(
    "More",
    `<div class="card">${isOwner() ? `${listLink("Weekly summary", "Last week: ₦312,000 · sent Mon 08:00", "weekly")}${listLink("Team", db.staff ? "1 staff member" : "No staff yet", "team")}${listLink("Business settings", "WhatsApp, email, integrations, withdrawal account", "settings")}` : ""}${listLink("Account", esc(who().name) + " · " + esc(who().email), "account")}</div>${btn("Log out", "logout", "text-btn more-logout")}`,
    { root: true, active: "more" },
  );
}
function teamScreen() {
  if (!isOwner())
    return restricted("Team", "Only your owner can manage the team.");
  return shell(
    "Team",
    `<div class="card table-wrap team-table"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Permissions</th><th></th></tr></thead><tbody><tr><td><span class="row"><span class="avatar">${initials(db.owner.name)}</span><strong>${esc(db.owner.name)}</strong></span></td><td>${esc(db.owner.email)}</td><td>Owner · you</td><td>All</td><td></td></tr>${db.staff ? `<tr data-go="member" tabindex="0" role="button"><td><span class="row"><span class="avatar">${initials(db.staff.name)}</span><strong>${esc(db.staff.name)}</strong></span></td><td>${esc(db.staff.email)}</td><td>Staff</td><td>${db.staff.permissions.length} of 8 permissions</td><td>${ico("caret")}</td></tr>` : ""}</tbody></table></div><div class="mobile-only team-mobile"><div class="list-link"><span class="avatar">${initials(db.owner.name)}</span><div class="grow"><strong>${esc(db.owner.name)}</strong><p>Owner · you</p></div></div>${db.staff ? `<a href="#/member" class="list-link"><span class="avatar">${initials(db.staff.name)}</span><div class="grow"><strong>${esc(db.staff.name)}</strong><p>Staff · ${db.staff.permissions.length} of 8 permissions</p></div>${ico("homeChevron")}</a>` : empty("No staff yet", "Invite a staff member to help record sales.")}</div>${db.invite && !db.invite.used ? `<div class="card" style="margin-top:16px">${listLink("Invite pending", "Works once · expires in 7 days", "invite")}${btn("Cancel invite", "cancel-invite", "text-btn danger")}</div>` : ""}<p class="table-note">Only you can invite or remove staff and change what they can do.</p><div class="sticky-actions mobile-only">${btn(ico("invite") + "Invite staff", "invite")}</div>`,
    {
      active: "team",
      root: true,
      actions: btn(ico("invite") + "Invite staff", "invite"),
    },
  );
}
function inviteScreen() {
  if (!isOwner())
    return restricted("Team", "Only your owner can invite staff.");
  if (!db.invite || db.invite.expires < Date.now() || db.invite.used) {
    db.invite = {
      token: crypto.randomUUID(),
      expires: Date.now() + 7 * 86400000,
      used: false,
    };
    save();
  }
  const url =
    location.origin + location.pathname + "#/join?token=" + db.invite.token;
  return shell(
    "Invite staff",
    `<div class="card pad stack"><p class="muted">Share this link with your staff member. It works once and expires in 7 days.</p>${field("invite", "Invite link", url, "text", "", "readonly")}${notice("<strong>What they can do at first</strong><p>Record sales and View inventory. You can change this in Team after they join.</p>")}<div class="invite-actions sticky-actions">${btn("Copy link", "copy-invite", "secondary")}${btn("Share on WhatsApp", "share-invite")}</div><p class="small muted desktop-only">Demo invite: this link works in this browser only until the team API is connected.</p></div>`,
    { active: "team", back: "team", tabs: false, cls: "narrow" },
  );
}
function memberScreen() {
  if (!isOwner())
    return restricted("Team", "Only your owner can manage staff.");
  if (!db.staff)
    return shell(
      "Staff member",
      empty(
        "Staff member removed",
        "They no longer have access to this business.",
      ),
      { back: "team", tabs: false },
    );
  return shell(
    "Staff member",
    `<div class="stack"><div class="card pad"><div class="row"><span class="avatar">${initials(db.staff.name)}</span><div><h2>${esc(db.staff.name)}</h2><p class="caption muted">${esc(db.staff.email)} · Staff</p></div></div></div><section><h2 style="margin-bottom:12px">What ${esc(db.staff.name.split(" ")[0])} can do</h2><div class="card">${permissionDefinitions.map(([id, l]) => `<div class="kv between" style="flex-direction:row"><span>${l}</span><strong class="caption ${db.staff.permissions.includes(id) ? "teal" : "muted"}">${db.staff.permissions.includes(id) ? "Can" : "Can’t"}</strong></div>`).join("")}${listLink("Manage permissions", db.staff.permissions.length + " of 8 permissions", "permissions")}</div></section>${btn("Remove staff", "remove-staff", "secondary danger")}</div>`,
    { active: "team", back: "team", tabs: false, cls: "narrow" },
  );
}
function permissionsScreen() {
  if (!isOwner() || !db.staff)
    return restricted(
      "Permissions",
      "Only your owner can manage staff permissions.",
    );
  permissionDraft ??= [...db.staff.permissions];
  const disabled =
    JSON.stringify([...permissionDraft].sort()) ===
    JSON.stringify([...db.staff.permissions].sort());
  return shell(
    db.staff.name.split(" ")[0] + "’s permissions",
    `<p class="muted" style="margin-bottom:24px">${esc(db.staff.name.split(" ")[0])} has ${permissionDraft.length} of 8 permissions. Changes apply as soon as you save.</p><div class="permission-grid">${[
      "Sales",
      "Stock",
      "Products & prices",
    ]
      .map(
        (g) =>
          `<section class="card permission-group"><p class="eyebrow">${g}</p>${permissionDefinitions
            .filter((x) => x[3] === g)
            .map(
              ([id, l, c]) =>
                `<div class="permission-row"><div class="grow"><h3>${l}</h3><p>${c}</p></div><button class="switch" role="switch" aria-label="${l}" aria-checked="${permissionDraft.includes(id)}" data-action="permission" data-value="${id}" ${!["record", "inventory"].includes(id) && !permissionDraft.includes("inventory") ? "disabled" : ""}><span>${permissionDraft.includes(id) ? "✓" : ""}</span></button></div>`,
            )
            .join("")}</section>`,
      )
      .join(
        "",
      )}</div><p class="table-note">Inviting, removing staff and managing staff always stays with you. Financial information and profit stay owner-only.</p><div class="settings-actions sticky-actions">${btn("Save changes", "save-permissions", "primary", disabled ? "disabled" : "")}</div>`,
    {
      active: "team",
      back: "member",
      tabs: false,
      cls: "permission-content",
      actions: btn(
        "Save changes",
        "save-permissions",
        "primary",
        disabled ? "disabled" : "",
      ),
    },
  );
}
function settingsScreen() {
  if (!isOwner())
    return restricted(
      "Business settings",
      "Only your owner can change business settings.",
    );
  return shell(
    "Business settings",
    `<form id="settings-form" class="stack" novalidate><div class="card pad stack-sm">${field("business", "Business name", db.business.name, "text", "", "required")}${field("phone", "WhatsApp number", db.business.phone, "tel")}${field("email", "Email for weekly summary", db.business.email, "email", "", "required")}</div><section><p class="eyebrow" style="margin-bottom:8px">Integrations</p><div class="card">${kv("WhatsApp summary", "Sandbox")}${kv("Paystack · set up by Invent IO", "Sandbox")}</div></section>${db.business.collection ? `<section><p class="eyebrow" style="margin-bottom:8px">Withdrawals</p><div class="card">${listLink("Withdrawal account", db.bank ? esc(db.bank.bank) + " •••• " + db.bank.last4 : "None set", "bank")}</div><p class="small muted" style="margin-top:8px">Only you can see or change this. Shown only for businesses using Invent IO payment collection.</p></section>` : ""}<p class="form-error" id="form-error"></p><div class="settings-actions"><button class="primary" type="submit" disabled>Save changes</button></div></form>`,
    { active: "settings", back: "more", tabs: false, cls: "narrow" },
  );
}
function bankScreen(edit = false) {
  if (!isOwner())
    return restricted("Withdrawal account", "Only your owner can change this.");
  return shell(
    "Withdrawal account",
    edit || !db.bank
      ? `<form id="bank-form" class="card pad stack" novalidate><p class="caption muted">Use an account in your name. Withdrawals are simulated during testing.</p><label class="field">Bank<select name="bank" required><option value="">Choose bank</option>${["GTBank", "Access Bank", "First Bank", "UBA", "Zenith Bank"].map((v) => `<option ${db.bank?.bank === v ? "selected" : ""}>${v}</option>`).join("")}</select><span class="error" data-error="bank"></span></label>${field("number", "Account number", "", "text", "10-digit account number", 'inputmode="numeric" pattern="[0-9]{10}" maxlength="10" required')}${field("name", "Account name", db.bank?.name || db.owner.name, "text", "Demo account name · bank verification is not connected", "readonly")}<p class="form-error" id="form-error"></p><div class="sticky-actions"><button type="submit" class="primary">Save account</button></div></form>`
      : `<div class="stack"><div class="card">${kv("Bank", esc(db.bank.bank))}${kv("Account name", esc(db.bank.name))}${kv("Account number", "•••• " + db.bank.last4)}</div><p class="caption muted">This is where your withdrawals go. Only you can see or change it.</p><div class="sticky-actions">${link("Change account", "bank-edit", "primary")}</div></div>`,
    { active: "settings", back: "settings", tabs: false, cls: "narrow" },
  );
}
function accountScreen() {
  const p = who();
  return shell(
    "Account",
    `<div class="stack"><div class="card">${kv("Name", esc(p.name))}${kv("Email", esc(p.email))}${kv("Role", isOwner() ? "Owner" : "Staff")}</div>${!isOwner() ? `<section><h2 style="margin-bottom:12px">Your permissions</h2><div class="card">${permissionDefinitions.map(([id, l]) => kv(l, allowed(id) ? "Can" : "Can’t")).join("")}</div><p class="small muted" style="margin-top:8px">Your owner can change these in Team.</p></section>` : ""}<div class="card">${listLink("Password", "Send yourself a password reset link", "forgot")}</div>${btn("Log out", "logout", "secondary")}<details class="caption muted"><summary>Preview options</summary><p class="small" style="margin:12px 0">Local sample data only. Authentication, bank verification, invitations and messages need backend integration.</p><div class="chips">${btn("Preview as " + (isOwner() ? "Staff" : "Owner"), "switch-role", "pill")}${btn("Reset demo data", "reset-demo", "pill")}${link("Review designed states", "states", "pill")}</div></details></div>`,
    { active: "more", back: "more", tabs: false, cls: "narrow" },
  );
}
function weeklyScreen() {
  if (!isOwner())
    return restricted(
      "Weekly summary",
      "Only your owner can see the weekly summary.",
    );
  return shell(
    "Weekly summary",
    `<div class="stack"><div><h2>Last week</h2><p class="caption muted">Mon 21 – Sun 27 Sep</p></div><section class="card pad summary-grid"><div><span class="caption muted">Recorded sales</span><strong class="money-lg">₦312,000</strong><span class="caption muted">96 sales</span></div><div><span class="caption muted">Profit</span><strong class="money-lg">₦78,400</strong><span class="small muted">93 of 96 sales have cost prices</span></div><div><span class="caption muted">Pending payments</span><strong class="money-lg">${pending().length}</strong><span class="caption muted">${money(pending().reduce((s, p) => s + p.amount, 0))}</span></div></section>${notice("<strong>Pending payments aren’t sales yet</strong><p>Record what was sold so these payments count in your sales.</p>" + btn("Review pending payments", "view-pending", "text-btn"), "warning")}<section><div class="section-title"><h2>Top products</h2><span class="small muted">By quantity sold</span></div><div class="card">${[
      ["shea", 41],
      ["soap", 33],
      ["lotion", 18],
    ]
      .map(([id, q]) => {
        const p = product(id);
        return p
          ? `<div class="line-item">${thumb(p)}<strong class="grow">${esc(p.name)}</strong><span class="caption">${q} sold</span></div>`
          : "";
      })
      .join(
        "",
      )}</div></section><section><div class="section-title"><h2>Low stock</h2>${link("View products", "products", "text-btn")}</div><div class="card">${db.products
      .filter((p) => !p.archived && p.stock <= p.alert)
      .map(
        (p) =>
          `<a class="list-link" href="#/product?id=${p.id}">${thumb(p)}<div class="grow"><strong>${esc(p.name)}</strong>${stockLabel(p)}</div>${ico("caret")}</a>`,
      )
      .join(
        "",
      )}</div></section><p class="caption muted">Sent Mon 28 Sep, 08:00 · WhatsApp (sandbox) and email</p><p class="small muted">Voided sales and payments marked Not a sale are excluded.</p></div>`,
    { active: "weekly", back: "more", tabs: false, cls: "medium" },
  );
}
function restricted(t, c) {
  return shell(
    t,
    empty("You don’t have access", c, link("Go home", "home", "primary")),
    { active: "home", back: "home", tabs: false },
  );
}
function noBusiness() {
  return shell(
    "No business",
    empty(
      "You no longer have access",
      "Ask your owner for a new invite link.",
      btn("Log out", "logout", "primary"),
    ),
    { tabs: false },
  );
}
function salesSummary() {
  const s = summary();
  return shell(
    "Sales summary",
    `<div class="stack"><div class="chips">${["Today", "This week"].map((v) => btn(v, "summary-period", `pill ${period === v ? "active" : ""}`, `data-value="${v}"`)).join("")}</div><div class="card pad stack-sm"><p class="caption muted">${period}</p><strong class="money-xl">${money(s.amount)}</strong><p>${s.count} sales</p>${isOwner() ? `<div class="divider" style="padding-top:16px"><p class="caption muted">Profit</p><strong class="money-lg">${money(s.profit)}</strong><p class="small muted">${s.count - s.missing} of ${s.count} sales have cost prices</p></div>` : ""}</div><h2>Products sold</h2><div class="card">${db.products
      .filter((p) =>
        db.payments.some(
          (s) => s.status === "recorded" && s.items?.some((i) => i.id === p.id),
        ),
      )
      .map(
        (p) =>
          `<div class="line-item">${thumb(p)}<strong class="grow">${esc(p.name)}</strong><span>${db.payments.filter((s) => s.status === "recorded").reduce((s, x) => s + (x.items?.find((i) => i.id === p.id)?.quantity || 0), 0)} sold</span></div>`,
      )
      .join("")}</div></div>`,
    { active: "sales", back: "sales", tabs: false, cls: "narrow" },
  );
}
function authScreen(kind) {
  const titles = {
    login: "Log in",
    create: "Create account",
    forgot: "Forgot password",
    reset: "Set new password",
    join: "Join " + db.business.name,
    check: "Check your email",
    expired: "Link expired",
  };
  const title = titles[kind];
  let body = "";
  if (
    kind === "join" &&
    (!db.invite ||
      db.invite.used ||
      db.invite.expires < Date.now() ||
      params.get("token") !== db.invite.token)
  )
    kind = "expired";
  if (kind === "login")
    body =
      brand() +
      field(
        "email",
        "Email",
        "amaka@mail.com",
        "email",
        "",
        'required autocomplete="username"',
      ) +
      field(
        "password",
        "Password",
        "",
        "password",
        "",
        'required autocomplete="current-password"',
      ) +
      `<div class="auth-toolbar">${btn("Show password", "show-password", "text-btn mobile-only")}${link("Forgot password?", "forgot", "text-btn")}</div><p class="small muted auth-hint">Joining a team? Open the invite link from your owner.</p><div class="auth-bottom"><button class="primary" type="submit">Log in</button>${link("Create account", "create", "text-btn")}</div>`;
  if (kind === "create" || kind === "join")
    body = `${kind === "join" ? notice(`<strong>${esc(db.owner.name)} invited you as Staff</strong><p>You can record sales and view inventory. Your owner can change what you can do.</p>`) : ""}${field("name", "Your name", "", "text", "", 'required autocomplete="name"')}${field("email", "Email", "", "email", "", 'required autocomplete="email"')}${field("phone", "Phone (optional)", "", "tel")}${field("password", "Password", "", "password", "At least 8 characters", 'required minlength="8" autocomplete="new-password"')}${btn("Show password", "show-password", "text-btn mobile-only")}${kind === "create" ? field("business", "Business name", "", "text", "You can change it later in Business settings", "required") : ""}<div class="auth-bottom"><button class="primary" type="submit">${kind === "join" ? "Create account & join" : "Create account"}</button>${link("Log in instead", "login", "text-btn")}</div>`;
  if (kind === "forgot")
    body = `<p class="muted">Enter your account email. We’ll send you a link to reset your password.</p>${field("email", "Email", "", "email", "", 'required autocomplete="email"')}<div class="auth-bottom"><button class="primary" type="submit">Send reset link</button>${link("Back to log in", "login", "text-btn")}</div>`;
  if (kind === "reset")
    body = `<p class="muted">Choose a new password for ${esc(db.owner.email)}.</p>${field("password", "New password", "", "password", "At least 8 characters", 'required minlength="8" autocomplete="new-password"')}${field("confirm", "Confirm new password", "", "password", "", 'required autocomplete="new-password"')}${btn("Show passwords", "show-password", "text-btn")}<div class="auth-bottom"><button class="primary" type="submit">Save new password</button></div>`;
  if (kind === "check")
    body = `<div class="success-mark">${ico("successCheck")}</div><h1 class="center">Check your email</h1><p class="muted">If there’s an account with that email, we’ll send a password reset link.</p><p class="small muted">Email delivery is not connected in this preview.</p><div class="auth-bottom">${link("Preview reset screen", "reset", "primary")}${link("Back to log in", "login", "text-btn")}</div>`;
  if (kind === "expired")
    body = empty(
      "This link has expired",
      "Ask your owner for a new invite, or request another password reset link.",
      link("Back to log in", "login", "primary"),
    );
  return `<div class="auth-layout"><aside class="auth-brand"><a href="#/welcome"><span class="brand"><span class="brand-mark">${ico("authLogo")}</span><span>Invent IO</span></span></a><div class="auth-brand-copy"><h1>Every sale, automatically tracked.</h1><p>A customer pays, you tap what they bought — the sale is recorded and your stock updates itself.</p></div></aside><div class="auth-mobile-header"><a href="#/welcome" class="icon-btn" aria-label="Back">${ico("back")}</a>${esc(titles[kind] || title)}</div><main class="auth-main"><form id="auth-form" data-kind="${kind}" class="auth-form" novalidate>${!["login", "check", "expired"].includes(kind) ? `<div class="auth-heading"><h1>${esc(titles[kind])}</h1>${kind === "create" ? "<p>Set up your Invent IO account. You’ll be the owner of your business.</p>" : ""}</div>` : ""}${body}<p id="form-error" class="form-error"></p>${["login", "create", "join"].includes(kind) ? '<p class="small muted">Demo preview · no real account is created. Log in with amaka@mail.com and inventio-demo.</p>' : ""}</form></main></div>`;
}
function setupScreen() {
  return shell(
    "Set up your business",
    `<form id="setup-form" class="card pad setup-card stack" novalidate><p class="eyebrow">Step 1 of 2</p><p class="muted">Where should your weekly summary of sales and stock go?</p>${field("phone", "WhatsApp number", db.business.phone, "tel", "0803... or +234...")}${field("email", "Email for weekly summary", db.business.email, "email", "From your account — change it if you like", "required")}<p id="form-error" class="form-error"></p><div class="sticky-actions auth-bottom"><button type="submit" class="primary">Continue</button>${link("Skip WhatsApp for now", "first-products", "text-btn")}</div></form>`,
    { tabs: false, cls: "narrow" },
  );
}
function readyScreen() {
  return shell(
    db.business.name,
    `<div class="card pad stack setup-card"><div class="success-mark">${ico("successCheck")}</div><div class="center"><h1>${esc(db.business.name)} is ready</h1><p class="caption muted" style="margin-top:8px">${db.products.length} products added · weekly summary ${db.business.phone ? "to " + esc(db.business.phone) : "by email"}</p></div><p class="muted">When a customer pays, tap Record payment and choose what they bought. Invent IO records the sale and updates your stock.</p><p class="small muted">You can add more products, invite staff and change settings any time.</p><div class="sticky-actions">${link("Go to Home", "home", "primary")}</div></div>`,
    { tabs: false, cls: "narrow" },
  );
}
function preview(type = "home") {
  let body =
    type === "products"
      ? productsBody()
      : type === "sales"
        ? pendingTable()
        : type === "permissions"
          ? `<h2>Bisi’s permissions</h2><div class="permission-grid" style="margin-top:32px">${[
              "Sales",
              "Stock",
              "Products & prices",
            ]
              .map(
                (g) =>
                  `<div class="card pad"><p class="eyebrow">${g}</p>${permissionDefinitions
                    .filter((x) => x[3] === g)
                    .map(
                      ([id, l, c]) =>
                        `<div class="permission-row"><div class="grow"><h3>${l}</h3><p>${c}</p></div><span class="switch" aria-checked="${["record", "inventory"].includes(id)}"><span></span></span></div>`,
                    )
                    .join("")}</div>`,
              )
              .join("")}</div>`
          : homeBody();
  const phone =
    type === "home"
      ? `<div class="phone-top between"><div><h1>${esc(db.business.name)}</h1><p class="caption muted">Sat 3 Oct</p></div><span class="avatar">AO</span></div><div class="home-content">${homeBody()}</div>`
      : type === "products"
        ? `<h1>Products</h1><div style="margin-top:32px">${productsBody()}</div>`
        : type === "sales"
          ? `<h1>Sales</h1><div class="chips" style="margin:32px 0 16px"><span class="pill active">Pending payments (3)</span><span class="pill">Recorded</span></div>${pendingTable()}`
          : body;
  return `<div class="phone-preview mobile-only" aria-hidden="true" inert><div class="phone-inner">${phone}</div></div><div class="app-preview" aria-hidden="true" inert><div class="preview-inner">${sidebar(type)}<div class="workspace"><header class="topbar"><h1>${type === "home" ? "Home" : type === "products" ? "Products" : type === "sales" ? "Sales" : "Bisi’s permissions"}</h1>${recordBtn()}</header><div class="content">${body}</div></div></div></div>`;
}
function landingScreen() {
  document.title = "Invent IO · Every sale, automatically tracked.";
  return `<div class="landing"><header class="landing-nav"><a href="#/welcome">${brand()}</a><nav><a href="#how-it-works" data-scroll="how-it-works">How it works</a><a href="#features" data-scroll="features">Features</a><a href="#owner-staff" data-scroll="owner-staff">Owner & Staff</a>${link("Log in", "login", "secondary")}${link("Create account", "create", "primary")}</nav></header><main><section class="landing-hero"><div><p class="eyebrow">Sales and stock, connected</p><h1>Every sale, automatically tracked.</h1><p>A customer pays, you tap what they bought — the sale is recorded and your stock updates itself.</p><div class="actions">${link("Create account", "create", "primary")}${link("Log in", "login", "secondary")}</div><p class="caption">Works on your phone and your computer — same account, same data.</p></div>${preview()}</section><section class="landing-section" id="how-it-works"><p class="eyebrow">How it works</p><h2>From payment to recorded sale</h2><div class="steps"><article class="step"><span class="step-number">1</span><h3>A customer pays</h3><p>Cash, transfer or card. Enter the amount, or see the payment come in when it’s collected through Invent IO.</p><div class="card"><div class="between"><strong class="money-lg">₦5,000</strong>${status("Pending")}</div><p class="small">Cash · Ada O. · Today 10:42</p></div></article><article class="step"><span class="step-number">2</span><h3>Tap what they bought</h3><p>Pick the products. The total is checked against the payment — a small difference, like a discount, is fine.</p><div class="card"><strong>₦5,000 selected of ₦5,000</strong><p class="teal small" style="margin-top:8px">✓ Matches the payment</p></div></article><article class="step"><span class="step-number">3</span><h3>Stock and profit update</h3><p>Stock goes down by itself, low stock is flagged, and profit is worked out from your cost prices.</p><div class="card stack-sm"><div class="row">${thumb(db.products[0] || initialData().products[0])}<span class="grow">Shea butter 250g</span><strong>17 → 15</strong></div><div class="row"><span class="product-placeholder">${ico("package")}</span><span class="grow">Black soap<br><span class="small" style="color:#b45309">Check count — recount when you can</span></span><strong>1 → −1</strong></div></div></article></div></section><section class="landing-section features" id="features"><div class="feature-row"><div><p class="eyebrow">Stock</p><h2>Know what sold. Know what’s left.</h2><p>Sales and stock stay connected, so you spend less time counting and more time running your business. Low items, items out of stock and counts that need checking each have their own filter.</p></div>${preview("products")}</div><div class="feature-row reverse">${preview("sales")}<div><p class="eyebrow">Sales</p><h2>Every payment waits for its products.</h2><p>Payments waiting for products stay in one list, oldest first. They only count in your sales once you record what was sold.</p></div></div><div class="feature-cards">${[
    [
      "featureWarning",
      "Low-stock alerts",
      "Set an alert number per product. Anything at or below it shows as Low.",
    ],
    [
      "featureCheck",
      "Selling is never blocked",
      "Sell more than the app shows and the product is marked “Check count” so you can recount.",
    ],
    [
      "featureChart",
      "Profit on every sale",
      "Selling price minus cost price. If a cost price is missing, profit shows “Not available” — never a guess.",
    ],
    [
      "featureUsers",
      "Owner and Staff",
      "Invite staff with a link. They see only what you allow — never your cost prices or profit.",
    ],
    [
      "featureReceipt",
      "Weekly summary",
      "Last week’s sales, top products and low stock, sent to your email. WhatsApp delivery is in testing.",
    ],
    [
      "featureBank",
      "Wallet",
      "For businesses that collect payments through Invent IO. Withdrawals currently run in test mode — no real money moves yet.",
    ],
  ]
    .map(
      ([i, t, c]) =>
        `<article class="card">${ico(i)}<h3>${t}</h3><p>${c}</p></article>`,
    )
    .join(
      "",
    )}</div></section><section class="landing-section owner-staff" id="owner-staff"><div class="feature-row"><div><p class="eyebrow">Owner & Staff</p><h2>Your staff record sales. You decide what else they can do.</h2><p>There are 8 permissions, from recording sales to changing prices. Turn each one on or off for every staff member. Inviting and removing staff always stays with you.</p></div>${preview("permissions")}</div></section><section class="closing"><h2>Know what sold. Know what’s left.</h2><p>Set up your business and add your first products — you can add the rest any time.</p>${link("Create account", "create", "primary")}</section></main><footer class="landing-footer">${brand()}<span>Sales and stock, connected.</span><span>Withdrawals are in test mode. No real money moves.</span></footer></div>`;
}
let editPaymentId = null,
  pendingSuccess = null,
  modalAction = null,
  withdrawAmount = 0,
  recordMethod = "Cash",
  stockVersion = null;
function closeModal() {
  if (!$("#overlay").firstChild) return;
  $("#overlay").innerHTML = "";
  $("#app").inert = false;
  document.body.style.overflow = "";
  modalAction = null;
  if (modalFocus?.isConnected) modalFocus.focus();
}
function modal(title, body, footer = "", { subtitle = "", cls = "" } = {}) {
  modalFocus = document.activeElement;
  const keyIndex = body.indexOf('<div class="keypad"');
  const keys = keyIndex >= 0 ? body.slice(keyIndex) : "";
  if (keyIndex >= 0) body = body.slice(0, keyIndex);
  $("#overlay").innerHTML =
    `<div class="modal-backdrop"><section class="dialog ${cls}" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1"><header class="dialog-header"><div><h2 id="dialog-title">${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div><button class="icon-btn" data-action="close" aria-label="Close"><span class="desktop-only">×</span><span class="mobile-only">${ico("back")}</span></button></header><div class="dialog-body">${body}</div>${footer ? `<footer class="dialog-footer">${footer}</footer>` : ""}${keys}</section></div>`;
  $("#app").inert = true;
  document.body.style.overflow = "hidden";
  $(".dialog").focus();
}
function confirmDialog(
  title,
  copy,
  action,
  label = "Confirm",
  destructive = false,
) {
  modal(
    title,
    `<p class="muted">${copy}</p>`,
    btn("Cancel", "close", "secondary cancel") +
      btn(label, "modal-confirm", destructive ? "primary danger" : "primary"),
  );
  modalAction = action;
}
function keypad(target) {
  return `<div class="keypad" aria-label="Amount keypad">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "⌫"].map((v) => btn(v, "key", "", `data-target="${target}" data-value="${v}" aria-label="${v === "⌫" ? "Backspace" : v}"`)).join("")}</div>`;
}
function recordModal(editId = null) {
  editPaymentId = editId;
  if (!allowed("record")) {
    toast("Your owner has turned off Record sales.");
    return;
  }
  recordMethod = payment(editId)?.method || "Cash";
  modal(
    editId ? "Edit payment" : "Record payment",
    `<label class="field">Amount received<div class="amount-input"><span>₦</span><input id="record-amount" type="text" inputmode="decimal" placeholder="0" autocomplete="off" aria-label="Amount received"></div><span class="error" id="amount-error"></span></label><div class="stack-sm"><p class="caption">How they paid</p><div class="method-picker">${["Cash", "Transfer", "Card"].map((v) => btn((v === recordMethod ? ico("tick") : "") + v, "method", `pill ${v === recordMethod ? "active" : ""}`, `data-value="${v}"`)).join("")}</div></div>${field("customer", "Customer name (optional)", "", "text", "", 'maxlength="100" id="record-customer"')}${keypad("record-amount")}`,
    btn("Cancel", "close", "secondary cancel") +
      btn("Continue", "record-continue", "primary", "disabled"),
    {
      subtitle: "Enter what the customer paid. You’ll pick the products next.",
      cls: "record-dialog",
    },
  );
  if (editId) {
    $("#record-amount").value = payment(editId).amount;
    $("#record-customer").value = payment(editId).customer;
    $("#record-amount").dispatchEvent(new Event("input", { bubbles: true }));
  }
}
function beginPayment(id) {
  const p = payment(id);
  if (!p || p.status !== "pending")
    return toast("This payment has already been recorded.");
  if (!allowed("record"))
    return toast("Your owner has turned off Record sales.");
  draft = { paymentId: id, quantities: {} };
  search = "";
  go("select");
}
function confirmSale() {
  if (!allowed("record"))
    return toast("Permission changed. Your owner has turned off Record sales.");
  try {
    pendingSuccess = recordSale(
      db,
      draft?.paymentId,
      draft?.quantities || {},
      isOwner() ? "Amaka" : "Bisi",
    );
    save();
    draft = null;
    view = "recorded";
    selectedSale = pendingSuccess.p.id;
    go("sales", true);
  } catch (error) {
    toast(error.message);
  }
}
function showSaleSuccess() {
  const { p, items } = pendingSuccess;
  pendingSuccess = null;
  const value = profit(p);
  modal(
    "Sale recorded",
    `<div class="sale-hero"><div class="success-mark">${ico("successCheck")}</div><h1>Sale recorded</h1><strong class="money-xl">${money(p.amount)}</strong>${status("Recorded", "good")}<p class="caption muted">${p.method}${p.customer ? " · " + esc(p.customer) : ""} · Today 10:42</p></div>${isOwner() ? `<div class="profit-card between"><span>Profit on this sale</span><strong>${value == null ? "Not available" : money(value)}</strong></div>` : ""}${allowed("inventory") ? `<section><h2 style="margin-bottom:12px">Stock updated</h2><div class="card">${items.map((i) => `<div class="line-item">${thumb(i)}<span class="grow">${esc(i.name)}</span><strong>${i.stock} → ${i.stock - i.quantity}</strong></div>`).join("")}</div></section>` : notice("✓ Stock updated automatically")}${allowed("inventory") && items.some((i) => i.stock - i.quantity < 0) ? notice("Check count — recount when you can. Selling is never blocked.", "warning") : ""}`,
    btn("Record another payment", "record", "primary") +
      btn(
        "Next pending payment (" + pending().length + ")",
        "next-pending",
        "secondary",
        pending().length ? "" : "disabled",
      ) +
      btn("Done", "close", "text-btn mobile-only"),
    { cls: "wide success-dialog" },
  );
}
function stockModal(id, correct = false) {
  if (!allowed("stock"))
    return toast("Your owner hasn’t given you permission to update stock.");
  const p = product(id);
  stockVersion = p.stock;
  modal(
    correct ? "Correct count" : "Add received",
    `<h3>${esc(p.name)}</h3><p class="caption muted">${p.stock} in stock now</p>${field("quantity", correct ? "Actual stock count" : "Quantity received", correct ? p.stock : "", "number", correct ? "Set this to the number you counted." : "This will be added to your current stock.", 'step="1" ' + (!correct ? 'min="1"' : "") + ' id="stock-quantity" required')}<p class="form-error" id="stock-error"></p>`,
    btn("Cancel", "close", "secondary cancel") +
      btn(
        correct ? "Set count" : "Add stock",
        "stock-save",
        "primary",
        `data-id="${id}" data-correct="${correct}"`,
      ),
  );
}
function withdrawModal(amount = 0) {
  if (!isOwner()) return;
  if (!db.bank) {
    modal(
      "Withdraw",
      empty(
        "Add a withdrawal account",
        "Add the bank account you want your withdrawals sent to.",
        btn("Add account", "withdraw-bank", "primary"),
      ),
      btn("Cancel", "close", "secondary"),
    );
    return;
  }
  withdrawAmount = amount;
  modal(
    "Withdraw",
    `<label class="field">Amount to withdraw<div class="amount-input"><span>₦</span><input id="withdraw-amount" type="text" inputmode="decimal" value="${amount || ""}" placeholder="0" aria-label="Amount to withdraw"></div><span class="error" id="withdraw-error"></span><span class="hint">You can withdraw up to ${money(db.balance)}</span></label><div class="card">${kv("Available balance", money(db.balance))}${kv("To", esc(db.bank.bank) + " · " + esc(db.bank.name) + " •••• " + db.bank.last4)}</div>${keypad("withdraw-amount")}`,
    btn("Cancel", "close", "secondary cancel") +
      btn(
        "Continue",
        "withdraw-review",
        "primary",
        amount > 500 && amount <= db.balance ? "" : "disabled",
      ),
    { cls: "withdraw-dialog" },
  );
}
function reviewWithdrawal() {
  const amount = Number($("#withdraw-amount")?.value || withdrawAmount);
  if (amount <= 500 || amount > db.balance) return;
  withdrawAmount = amount;
  modal(
    "Review withdrawal",
    `<div class="card withdraw-details">${kv("Withdrawal amount", money(amount))}${kv("Withdrawal fee", money(500))}${kv("Amount received", money(amount - 500))}${kv("To", esc(db.bank.bank) + " · " + esc(db.bank.name) + " •••• " + db.bank.last4)}</div><p class="caption muted">The withdrawal fee is set by your payment provider and taken from the withdrawal amount.</p>${notice("You can cancel while it’s Pending. Once it’s Processing, it can’t be stopped.")}<p class="small muted">Simulated · test mode, no real money moves</p>`,
    btn("Change amount", "withdraw-change", "secondary cancel") +
      btn("Confirm withdrawal", "withdraw-confirm", "primary"),
  );
}
function validate(form) {
  let valid = true;
  $$("[data-error]", form).forEach((x) => (x.textContent = ""));
  for (const el of $$("input,select", form)) {
    let error = "";
    if (el.required && !el.value.trim()) error = "This field is required.";
    else if (
      el.type === "email" &&
      el.value &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)
    )
      error = "Enter a valid email address.";
    else if (
      el.type === "password" &&
      el.minLength > 0 &&
      el.value.length < el.minLength
    )
      error = "Use at least " + el.minLength + " characters.";
    else if (
      el.type === "number" &&
      el.value &&
      (Number.isNaN(Number(el.value)) ||
        (el.min !== "" && Number(el.value) < Number(el.min)) ||
        (el.step === "1" && !Number.isInteger(Number(el.value))))
    )
      error =
        "Enter a valid " + (el.step === "1" ? "whole number" : "amount") + ".";
    if (error) {
      const slot = $(`[data-error="${el.name}"]`, form);
      if (slot) slot.textContent = error;
      valid = false;
    }
  }
  if (!valid) $("input:invalid", form)?.focus();
  return valid;
}
function phoneValid(v) {
  return !v || /^(0\d{10}|\+234\d{10})$/.test(v.replace(/[\s-]/g, ""));
}
function render() {
  const [path, query] = location.hash.replace(/^#\/?/, "").split("?");
  route = path || "welcome";
  params = new URLSearchParams(query);
  let html;
  const routes = {
    welcome: landingScreen,
    home: homeScreen,
    sales: salesScreen,
    products: productsScreen,
    product: productScreen,
    "product-new": () => editorScreen(),
    "product-edit": () => editorScreen(),
    select: () => selectScreen(),
    review: () => selectScreen(true),
    wallet: () => walletScreen(),
    transactions: () => walletScreen(true),
    transaction: transactionScreen,
    more: moreScreen,
    team: teamScreen,
    invite: inviteScreen,
    member: memberScreen,
    permissions: permissionsScreen,
    settings: settingsScreen,
    bank: () => bankScreen(),
    "bank-edit": () => bankScreen(true),
    account: accountScreen,
    weekly: weeklyScreen,
    setup: setupScreen,
    "first-products": () => editorScreen(true),
    ready: readyScreen,
    "sales-summary": salesSummary,
    "sale-detail": () =>
      shell("Sale detail", saleDetail(payment(params.get("id"))), {
        active: "sales",
        back: "sales",
        tabs: false,
        cls: "narrow",
      }),
  };
  if (
    ["login", "create", "forgot", "reset", "join", "check", "expired"].includes(
      route,
    )
  )
    html = authScreen(route);
  else if (route === "states") html = stateGallery();
  else if (route === "states-list") html = stateList();
  else if (route === "withdrawal-states") html = withdrawalStates();
  else if (route === "intro") html = introScreen();
  else if (params.has("state")) html = stateScreen();
  else
    html = (
      routes[route] ||
      (() =>
        shell(
          "Page not found",
          empty(
            "Page not found",
            "Choose a destination from the menu.",
            link("Home", "home", "primary"),
          ),
        ))
    )();
  $("#app").innerHTML = html;
  if (route === "welcome") scalePreviews();
  if (pendingSuccess) showSaleSuccess();
}
function scalePreviews() {
  $$(".app-preview").forEach((p) => {
    const scale = p.clientWidth / 1440;
    $(".preview-inner", p).style.transform = `scale(${scale})`;
    p.style.height = 900 * scale + "px";
  });
}
window.addEventListener("hashchange", () => {
  closeModal();
  dirty = false;
  permissionDraft = null;
  render();
  window.scrollTo(0, 0);
});
window.addEventListener("resize", () => {
  if (route === "welcome") scalePreviews();
  if (pendingSuccess) showSaleSuccess();
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
window.addEventListener("storage", (e) => {
  if (e.key === "invent-io-design-demo-v2") {
    db = readData();
    if (!isOwner() && (!db.staff || !allowed("record"))) {
      closeModal();
      draft = null;
      dirty = false;
      render();
      toast("Your permissions have changed.");
    }
  }
});
document.addEventListener("click", async (e) => {
  const scroll = e.target.closest("[data-scroll]");
  if (scroll) {
    e.preventDefault();
    document
      .getElementById(scroll.dataset.scroll)
      ?.scrollIntoView({ behavior: "smooth" });
    return;
  }
  const to = e.target.closest("[data-go]");
  if (to) {
    go(to.dataset.go);
    return;
  }
  const anchor = e.target.closest('a[href^="#/"]');
  if (anchor && dirty) {
    e.preventDefault();
    go(anchor.getAttribute("href").slice(2));
    return;
  }
  const b = e.target.closest("[data-action]");
  if (!b || b.disabled) return;
  const a = b.dataset.action,
    id = b.dataset.id,
    v = b.dataset.value;
  if (a === "close") return closeModal();
  if (a === "modal-confirm") {
    const fn = modalAction;
    closeModal();
    fn?.();
    return;
  }
  if (a === "payment-menu") {
    const p = payment(draft?.paymentId);
    modal(
      "Payment options",
      btn("Save for later", "save-later", "secondary") +
        btn("Not a sale", "not-sale", "text-btn danger", `data-id="${p.id}"`),
    );
    return;
  }
  if (a === "edit-payment") {
    return recordModal(id);
  }
  if (a === "record") {
    closeModal();
    return recordModal();
  }
  if (a === "method") {
    recordMethod = v;
    $$(".method-picker button").forEach((x) => {
      x.classList.toggle("active", x.dataset.value === v);
      x.innerHTML =
        (x.dataset.value === v ? ico("tick") : "") + x.dataset.value;
    });
    return;
  }
  if (a === "key") {
    const input = document.getElementById(b.dataset.target);
    if (!input) return;
    input.value =
      v === "⌫"
        ? input.value.slice(0, -1)
        : (input.value + v).replace(/^0+(?=\d)/, "").slice(0, 12);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  if (a === "record-continue") {
    if (!allowed("record")) return toast("Permission changed.");
    const amount = Number($("#record-amount").value),
      customer = $("#record-customer").value.trim();
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e10) return;
    if (editPaymentId) {
      const p = payment(editPaymentId);
      if (p?.method !== "Cash" || p.status !== "pending") return;
      p.amount = amount;
      p.customer = customer;
      save();
      closeModal();
      render();
      return;
    }
    const p = {
      id: crypto.randomUUID(),
      amount,
      method: recordMethod,
      customer,
      by: isOwner() ? "Amaka" : "Bisi",
      age: "Just now",
      status: "pending",
      date: "2026-10-03",
    };
    db.payments.push(p);
    save();
    closeModal();
    return beginPayment(p.id);
  }
  if (a === "open-payment") return beginPayment(id);
  if (a === "quantity") {
    if (!draft || !allowed("record")) return;
    draft.quantities[id] = Math.max(
      0,
      Math.min(999, (draft.quantities[id] || 0) + Number(v)),
    );
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    return;
  }
  if (a === "review-sale") return go("review");
  if (a === "confirm-sale") return confirmSale();
  if (a === "save-later") {
    closeModal();
    draft = null;
    go("sales");
    toast("Payment saved for later. It stays in Pending payments.");
    return;
  }
  if (a === "not-sale") {
    const p = payment(id);
    if (!p || !allowed("record")) return;
    confirmDialog(
      "Not a sale?",
      "This payment won’t count in sales. You can restore it later.",
      () => {
        p.status = "excluded";
        draft = null;
        save();
        go("sales", true);
        toast("Marked Not a sale.");
      },
      "Mark Not a sale",
    );
    return;
  }
  if (a === "restore") {
    if (!allowed("record"))
      return toast("Your owner has turned off Record sales.");
    const p = payment(id);
    if (!p) return;
    confirmDialog(
      "Restore to Pending payments?",
      "You’ll be able to record what was sold for this payment.",
      () => {
        if (p.status !== "excluded") return;
        p.status = "pending";
        save();
        view = "pending";
        go("sales", true);
        toast("Restored to Pending payments.");
      },
      "Restore",
    );
    return;
  }
  if (a === "void") {
    const p = payment(id);
    if (!p || !allowed("record") || (!isOwner() && p.by !== "Bisi")) return;
    confirmDialog(
      "Void this sale?",
      "The sale will no longer count in sales or profit. Its products will be returned to stock.",
      () => {
        if (!voidSale(db, p.id)) return;
        save();
        render();
        toast("Sale voided. Stock returned.");
      },
      "Void sale",
      true,
    );
    return;
  }
  if (a === "next-pending") {
    closeModal();
    return beginPayment(pending()[0]?.id);
  }
  if (a === "view-recorded") {
    view = "recorded";
    period = "Today";
    go("sales");
    return;
  }
  if (a === "view-pending") {
    view = "pending";
    go("sales");
    return;
  }
  if (a === "sales-view") {
    view = v;
    render();
    return;
  }
  if (a === "sort") {
    sort = v;
    render();
    return;
  }
  if (a === "period") {
    if (v === "Pick a date") {
      modal(
        "Pick a date",
        field(
          "date",
          "Date",
          "2026-10-02",
          "date",
          "",
          'id="sales-date" max="2026-10-03"',
        ),
        btn("Cancel", "close", "secondary") + btn("Apply", "date-apply"),
      );
      return;
    }
    period = v;
    render();
    return;
  }
  if (a === "date-apply") {
    period = $("#sales-date").value;
    closeModal();
    render();
    return;
  }
  if (a === "summary-period") {
    period = v;
    render();
    return;
  }
  if (a === "sale-detail") {
    selectedSale = id;
    if (innerWidth < 1200) go("sale-detail?id=" + id);
    else render();
    return;
  }
  if (a === "close-detail") {
    selectedSale = "";
    $(".master-detail .sale-detail")?.remove();
    $(".master-detail")?.style.setProperty("grid-template-columns", "1fr");
    return;
  }
  if (a === "product-filter") {
    productFilter = v;
    render();
    return;
  }
  if (a === "stock-add" || a === "stock-correct")
    return stockModal(id, a === "stock-correct");
  if (a === "stock-save") {
    if (!allowed("stock")) return toast("Permission changed.");
    const p = product(id),
      n = Number($("#stock-quantity").value),
      correct = b.dataset.correct === "true";
    if (
      $("#stock-quantity").value === "" ||
      !Number.isInteger(n) ||
      (!correct && n < 1)
    ) {
      return ($("#stock-error").textContent = "Enter a valid whole number.");
    }
    const latest = readData().products.find((x) => x.id === id);
    if (correct && latest?.stock !== stockVersion) {
      $("#stock-error").textContent =
        "Stock changed while you were counting. Current stock is " +
        latest.stock +
        ". Check the count and try again.";
      stockVersion = latest.stock;
      db = readData();
      return;
    }
    p.stock = correct ? n : p.stock + n;
    p.updated = "Today 10:42 · by " + (isOwner() ? "Amaka" : "Bisi");
    save();
    closeModal();
    render();
    toast(correct ? "Count set" : "Stock added");
    return;
  }
  if (a === "archive") {
    if (!allowed("edit")) return;
    confirmDialog(
      "Archive product?",
      "It will be hidden when recording sales. Past sales stay unchanged. You can restore it from Archived.",
      () => {
        product(id).archived = true;
        dirty = false;
        save();
        go("products", true);
        toast("Product archived");
      },
      "Archive product",
      true,
    );
    return;
  }
  if (a === "product-restore") {
    if (!allowed("edit")) return;
    product(id).archived = false;
    save();
    render();
    toast("Product restored");
    return;
  }
  if (a === "wallet-filter") {
    walletFilter = v;
    render();
    return;
  }
  if (a === "withdraw") return withdrawModal();
  if (a === "withdraw-bank") {
    closeModal();
    return go("bank-edit");
  }
  if (a === "withdraw-review") return reviewWithdrawal();
  if (a === "withdraw-change") return withdrawModal(withdrawAmount);
  if (a === "withdraw-confirm") {
    if (
      !isOwner() ||
      withdrawAmount <= 500 ||
      withdrawAmount > db.balance ||
      !db.bank
    )
      return;
    const t = {
      id: crypto.randomUUID(),
      type: "withdrawal",
      amount: withdrawAmount,
      age: "Today 10:42",
      status: "Pending",
      bank: db.bank.bank,
      last4: db.bank.last4,
      accountName: db.bank.name,
    };
    db.balance -= withdrawAmount;
    db.transactions.unshift(t);
    withdrawAmount = 0;
    save();
    closeModal();
    go("transaction?id=" + t.id);
    toast("Withdrawal pending · simulated");
    return;
  }
  if (a === "cancel-withdrawal") {
    if (!isOwner()) return;
    const t = db.transactions.find((x) => x.id === id);
    if (!t || !["Pending", "Waiting for funds"].includes(t.status)) return;
    confirmDialog(
      "Cancel withdrawal?",
      "The money will be returned to your available balance.",
      () => {
        if (!cancelWithdrawal(db, t.id)) return;
        save();
        render();
        toast("Withdrawal cancelled");
      },
      "Cancel withdrawal",
      true,
    );
    return;
  }
  if (a === "wallet-match") {
    const t = db.transactions.find((x) => x.id === id);
    let p = db.payments.find((p) => p.transactionId === id);
    if (!p) {
      p = {
        id: crypto.randomUUID(),
        transactionId: id,
        amount: t.amount,
        method: t.method,
        customer: t.customer,
        by: "Amaka",
        status: "pending",
        age: t.age,
        date: "2026-10-03",
      };
      db.payments.push(p);
      save();
    }
    return beginPayment(p.id);
  }
  if (a === "cancel-invite") {
    confirmDialog(
      "Cancel invite?",
      "The invite link will stop working.",
      () => {
        db.invite = null;
        save();
        render();
        toast("Invite cancelled");
      },
      "Cancel invite",
      true,
    );
    return;
  }
  if (a === "session-expired") {
    modal(
      "Session expired",
      "<p>Log in again to continue. Your recorded sales are safe.</p>",
      btn("Log in", "session-login"),
    );
    return;
  }
  if (a === "session-login") {
    closeModal();
    go("login", true);
    return;
  }
  if (a === "invite") return go("invite");
  if (a === "copy-invite" || a === "share-invite") {
    const url = $("input[name=invite]").value;
    if (a === "copy-invite") {
      try {
        await navigator.clipboard.writeText(url);
        toast("Invite link copied");
      } catch {
        $("input[name=invite]").select();
        toast("Select and copy the invite link.");
      }
    } else {
      window.open(
        "https://wa.me/?text=" +
          encodeURIComponent(
            "Join " + db.business.name + " on Invent IO: " + url,
          ),
        "_blank",
        "noopener,noreferrer",
      );
    }
    return;
  }
  if (a === "permission") {
    if (!isOwner()) return;
    permissionDraft = permissionDraft.includes(v)
      ? permissionDraft.filter((x) => x !== v)
      : [...permissionDraft, v];
    if (v === "inventory" && !permissionDraft.includes("inventory"))
      permissionDraft = permissionDraft.filter((x) => x === "record");
    dirty = true;
    render();
    return;
  }
  if (a === "save-permissions") {
    if (!isOwner() || !db.staff) return;
    db.staff.permissions = [...permissionDraft];
    dirty = false;
    save();
    go("member", true);
    toast("Permissions saved");
    return;
  }
  if (a === "remove-staff") {
    if (!isOwner()) return;
    confirmDialog(
      "Remove staff?",
      "They’ll lose access to this business. Their past sales stay in your records.",
      () => {
        db.staff = null;
        save();
        go("team", true);
        toast("Staff removed");
      },
      "Remove staff",
      true,
    );
    return;
  }
  if (a === "show-password") {
    const fields = $$("input[type=password],input[data-password]");
    const show = fields[0]?.type === "password";
    fields.forEach((x) => {
      x.dataset.password = "true";
      x.type = show ? "text" : "password";
    });
    b.textContent = show
      ? "Hide password" + (fields.length > 1 ? "s" : "")
      : "Show password" + (fields.length > 1 ? "s" : "");
    return;
  }
  if (a === "logout") {
    dirty = false;
    sessionStorage.removeItem("invent-role");
    go("login", true);
    return;
  }
  if (a === "switch-role") {
    dirty = false;
    setRole(isOwner() ? "staff" : "owner");
    go("home", true);
    return;
  }
  if (a === "reset-demo") {
    confirmDialog(
      "Reset demo data?",
      "This replaces local sample changes in this browser.",
      () => {
        db = initialData();
        save();
        setRole("owner");
        dirty = false;
        draft = null;
        go("home", true);
        toast("Demo data reset");
      },
      "Reset demo",
    );
    return;
  }
});
document.addEventListener("input", (e) => {
  const input = e.target;
  if (input.id === "product-search") {
    search = input.value;
    $("#product-results").innerHTML = productResults(filteredProducts());
    return;
  }
  if (input.id === "selection-search") {
    search = input.value;
    $("#product-picker").innerHTML = pickerProducts();
    return;
  }
  if (input.id === "record-amount") {
    const n = Number(input.value),
      valid =
        Number.isFinite(n) &&
        n > 0 &&
        n <= 1e10 &&
        /^\d*(\.\d{0,2})?$/.test(input.value);
    $("[data-action=record-continue]").disabled = !valid;
    $("#amount-error").textContent =
      input.value && !valid ? "Enter a valid amount." : "";
    return;
  }
  if (input.id === "withdraw-amount") {
    const n = Number(input.value),
      valid =
        Number.isFinite(n) &&
        n > 500 &&
        n <= db.balance &&
        /^\d*(\.\d{0,2})?$/.test(input.value);
    $("[data-action=withdraw-review]").disabled = !valid;
    $("#withdraw-error").textContent = input.value
      ? n > db.balance
        ? "Above available balance."
        : n <= 500
          ? "Enter more than the ₦500 fee."
          : !valid
            ? "Enter a valid amount."
            : ""
      : "";
    return;
  }
  if (input.closest("#settings-form,#product-form,#setup-form,#bank-form")) {
    dirty = true;
    const submit = $("#settings-form button[type=submit]");
    if (submit) submit.disabled = false;
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.id !== "product-photo") return;
  const file = e.target.files?.[0];
  if (!file) return;
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  ) {
    toast("Choose a JPG, PNG or WebP smaller than 2 MB.");
    return;
  }
  photo = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
  $("#photo-preview").innerHTML = `<img src="${photo}" alt="Product photo">`;
  dirty = true;
});
document.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  if (!validate(f)) return;
  const d = Object.fromEntries(new FormData(f));
  if (f.id === "auth-form") {
    const kind = f.dataset.kind;
    if (kind === "login") {
      if (
        ![db.owner.email, db.staff?.email]
          .filter(Boolean)
          .some((x) => x.toLowerCase() === d.email.toLowerCase()) ||
        d.password !== "inventio-demo"
      ) {
        $("#form-error").textContent =
          "Email or password is incorrect. Try again.";
        return;
      }
      setRole(
        d.email.toLowerCase() === db.staff?.email.toLowerCase()
          ? "staff"
          : "owner",
      );
      f.reset();
      go("home", true);
      toast("Demo workspace opened. Authentication is not connected.");
    } else if (kind === "create") {
      if (d.email.toLowerCase() === db.owner.email.toLowerCase()) {
        $("[data-error=email]", f).textContent =
          "This email is already registered. Log in instead.";
        return;
      }
      const fresh = initialData();
      fresh.owner = { name: d.name.trim(), email: d.email.trim() };
      fresh.business = {
        name: d.business.trim(),
        phone: d.phone.trim(),
        email: d.email.trim(),
        collection: false,
      };
      fresh.products = [];
      fresh.payments = [];
      fresh.transactions = [];
      fresh.staff = null;
      fresh.earlier = { amount: 0, count: 0, profit: 0, missing: 0 };
      fresh.balance = 0;
      fresh.totalReceived = 0;
      db = fresh;
      save();
      f.reset();
      setRole("owner");
      go("setup", true);
    } else if (kind === "join") {
      if (
        !db.invite ||
        db.invite.used ||
        db.invite.expires < Date.now() ||
        params.get("token") !== db.invite.token
      )
        return go("expired", true);
      db.staff = {
        name: d.name.trim(),
        email: d.email.trim(),
        permissions: ["record", "inventory"],
      };
      db.invite.used = true;
      save();
      f.reset();
      setRole("staff");
      go("home", true);
      toast("Joined the demo business");
    } else if (kind === "forgot") {
      f.reset();
      go("check", true);
    } else if (kind === "reset") {
      if (d.password !== d.confirm) {
        $("[data-error=confirm]", f).textContent = "Passwords don’t match.";
        return;
      }
      f.reset();
      go("login", true);
      toast("Password screen reviewed. Password changes require the backend.");
    }
    return;
  }
  if (f.id === "product-form") {
    const editing = route === "product-edit",
      p = editing ? product(params.get("id")) : null;
    if (
      !allowed(editing ? "inventory" : "add") ||
      (editing && !["edit", "price", "cost", "alert"].some(allowed))
    )
      return toast("Your permissions have changed.");
    if (!d.name.trim()) return;
    const values = {
      name: d.name.trim(),
      price: Number(d.price),
      cost: d.cost == null || d.cost === "" ? null : Number(d.cost),
      stock: editing ? p.stock : Number(d.stock),
      alert: Number(d.alert),
      image: photo,
      updated: "Today 10:42 · by " + (isOwner() ? "Amaka" : "Bisi"),
    };
    if (editing) {
      if (allowed("edit")) {
        p.name = values.name;
        p.image = photo;
      }
      if (allowed("price")) p.price = values.price;
      if (allowed("cost")) p.cost = values.cost;
      if (allowed("alert")) p.alert = values.alert;
      p.updated = values.updated;
    } else db.products.push({ id: crypto.randomUUID(), ...values });
    dirty = false;
    save();
    toast(editing ? "Changes saved" : "Product added");
    if (e.submitter?.value === "another") {
      render();
      return;
    }
    go(
      route === "first-products" ? "ready" : draft ? "select" : "products",
      true,
    );
    return;
  }
  if (f.id === "settings-form" || f.id === "setup-form") {
    if (!isOwner()) return;
    if (!phoneValid(d.phone)) {
      $("[data-error=phone]", f).textContent =
        "Enter a valid WhatsApp number, like 0803 123 4567 or +2348031234567.";
      return;
    }
    db.business.phone = d.phone.trim();
    db.business.email = d.email.trim();
    if (d.business) db.business.name = d.business.trim();
    dirty = false;
    save();
    if (f.id === "setup-form") go("first-products", true);
    else {
      render();
      toast("Changes saved");
    }
    return;
  }
  if (f.id === "bank-form") {
    if (!isOwner()) return;
    if (!/^\d{10}$/.test(d.number)) {
      $("[data-error=number]", f).textContent =
        "Enter a 10-digit account number.";
      return;
    }
    db.bank = { bank: d.bank, name: db.owner.name, last4: d.number.slice(-4) };
    dirty = false;
    save();
    f.reset();
    go("bank", true);
    toast("Demo account saved · verification is not connected");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#overlay").firstChild) {
    closeModal();
    return;
  }
  if (e.key === "Tab" && $("#overlay").firstChild) {
    const els = $$(
      "button:not(:disabled),input,select,a[href],textarea",
      $("#overlay"),
    ).filter((x) => x.getClientRects().length);
    if (!els.length) return;
    const first = els[0],
      last = els.at(-1);
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === $(".dialog"))
    ) {
      e.preventDefault();
      last.focus();
    } else if (
      !e.shiftKey &&
      (document.activeElement === last ||
        document.activeElement === $(".dialog"))
    ) {
      e.preventDefault();
      first.focus();
    }
  }
  if (["Enter", " "].includes(e.key) && e.target.matches("tr[role=button]")) {
    e.preventDefault();
    e.target.click();
  }
});
render();

function mobilePaymentCard(p) {
  return `<div class="card payment-summary"><div class="between"><strong class="money-lg">${money(p.amount)}</strong>${status("Pending")}</div><p class="caption muted" style="margin-top:8px">${esc(p.method)}${p.customer ? " · " + esc(p.customer) : ""} · ${esc(p.age)}${p.method === "Cash" && route !== "review" ? btn("Edit", "edit-payment", "payment-edit", `data-id="${p.id}"`) : ""}</p></div>`;
}
function mobileReview() {
  const p = payment(draft.paymentId),
    items = saleItems(),
    match = selectionTotal() === p.amount,
    low = items.filter((i) => i.stock < i.quantity);
  return `<div class="mobile-only mobile-review stack-sm">${mobilePaymentCard(p)}<div class="card"><div class="review-items">${items.map((i) => `<div class="line-item">${thumb(i)}<div class="grow">${esc(i.name)} × ${i.quantity}<small>${money(i.price)} each</small></div><strong>${money(i.price * i.quantity)}</strong></div>`).join("")}</div><div class="line-item between"><strong>Items total</strong><strong>${money(selectionTotal())}</strong></div><div class="line-item between"><strong>Paid</strong><strong>${money(p.amount)}</strong></div></div><div class="notice ${match ? "success" : "warning"}">${ico(match ? "reviewCheck" : "reviewWarning")}<strong>${match ? "Matches the payment" : "The total differs from the payment"}</strong></div>${low.length ? `<div class="notice warning">${ico("reviewWarning")}<div><strong>Check stock after this sale</strong><p>${low.map((i) => esc(i.name) + ": selling " + i.quantity + ", only " + i.stock + " in stock").join("<br>")}. It will show “Check count” so you can recount.</p></div></div>` : ""}<div class="sticky-actions">${btn("Confirm sale", "confirm-sale", "primary", match && items.length ? "" : "disabled")}${link("Back to products", "select", "text-btn")}</div></div>`;
}
function stateGallery() {
  return shell(
    "Design states",
    `<div class="stack"><p class="caption muted">Review sample states without changing your saved demo data.</p><div class="card">${["home", "products", "wallet", "transactions", "team", "weekly"].map((r) => listLink(r[0].toUpperCase() + r.slice(1), "Loading, error and empty states", "states-list?screen=" + r)).join("")}${listLink("Mobile intro", "Both introduction screens", "intro")}${listLink("Withdrawal states", "Pending, processing, waiting, successful, failed and cancelled", "withdrawal-states")}${btn("Session expired", "session-expired", "text-btn")}${listLink("Staff preview", "Use Account → Preview as Staff to review permissions", "account")}</div></div>`,
    { active: "more", back: "account", tabs: false, cls: "narrow" },
  );
}
function stateScreen() {
  const state = params.get("state"),
    titles = {
      home: "Home",
      products: isOwner() ? "Products" : "Stock",
      wallet: "Wallet",
      transactions: "Transactions",
      team: "Team",
      weekly: "Weekly summary",
    },
    title = titles[route] || route;
  if (
    !isOwner() &&
    ["wallet", "transactions", "team", "weekly"].includes(route)
  )
    return restricted(title, "Only your owner can see this.");
  if (state === "loading")
    return shell(
      title,
      `<div class="stack" role="status" aria-label="Loading ${title}"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><span class="sr-only">Loading ${title}…</span>${link("Finish preview", route, "text-btn")}</div>`,
      { active: route, root: true, fab: ["home", "products"].includes(route) },
    );
  if (state === "empty")
    return shell(
      title,
      empty(
        route === "products"
          ? "No products yet"
          : route === "team"
            ? "No staff yet"
            : route === "home"
              ? "You’re ready for your first sale"
              : route === "weekly"
                ? "Your first week starts here"
                : "No transactions yet",
        route === "products"
          ? "Add the products you sell. You can add more any time."
          : route === "team"
            ? "Invite your staff to help record sales."
            : "Your activity will appear here.",
        route === "products"
          ? link("Add product", "product-new", "primary")
          : route === "team"
            ? link("Invite staff", "invite", "primary")
            : recordBtn(),
      ),
      { active: route, root: true, fab: ["home", "products"].includes(route) },
    );
  return shell(
    title,
    `<div class="empty state-error"><span class="error-mark">${ico("connectionError")}</span><h2>Couldn’t load ${route === "products" ? "your products" : route === "team" ? "your team" : route === "home" ? "today’s sales" : route === "weekly" ? "your weekly summary" : route === "transactions" ? "your transactions" : "your wallet"}</h2><p>Check your connection and try again. ${route === "team" ? "Nobody’s access has changed." : route === "home" ? "Your sales are safe." : "Nothing was lost."}</p>${link("Try again", route, "primary")}</div>`,
    {
      active: route,
      back: ["wallet", "transactions", "team", "weekly"].includes(route)
        ? "home"
        : "",
      root: ["home", "products"].includes(route),
      fab: ["home", "products"].includes(route),
      tabs: ["home", "products"].includes(route),
    },
  );
}
function stateList() {
  const r = params.get("screen") || "home";
  return shell(
    "Review " + r,
    `<div class="card">${["loading", "error", "empty"].map((s) => listLink(s[0].toUpperCase() + s.slice(1), "Review the approved " + s + " pattern", r + "?state=" + s)).join("")}</div>`,
    { active: "more", back: "states", tabs: false, cls: "narrow" },
  );
}
function introScreen() {
  const second = params.get("step") === "2";
  return `<main class="intro"><div class="intro-photo ${second ? "second" : ""}">${second ? `<button class="intro-back icon-btn" data-go="intro" aria-label="Back">${ico("back")}</button>` : ""}<div class="intro-float card pad"><p class="caption muted">${second ? "Stock updated after each sale" : "₦2,000 cash payment received"}</p>${second ? "" : '<p class="teal caption" style="margin-top:12px">✓ Sale recorded</p>'}<div class="line-item">${thumb(initialData().products[0])}<div class="grow">Shea butter 250g${second ? "" : " × 1<br><small>₦2,000 each</small>"}</div><strong>${second ? "17 → 16" : "₦2,000"}</strong></div>${second ? `<div class="line-item"><img class="product-thumb" src="assets/lip.png" alt="Lip gloss"><div class="grow">Lip gloss<small style="color:#b45309">Now low · alert at 3</small></div><strong>2 → 1</strong></div>` : ""}</div></div><div class="intro-copy"><p class="small muted">${second ? "● ━  2 of 2" : "━ ●  1 of 2"}</p><h1>${second ? "Know what sold. Know what’s left." : "Every sale, automatically tracked."}</h1><p class="muted">${second ? "Sales and stock stay connected, so you spend less time counting and more time running your business." : "A customer pays, you tap what they bought — the sale is recorded and your stock updates itself."}</p>${link(second ? "Get started" : "Continue", second ? "create" : "intro?step=2", "primary full")}${second ? link("Log in", "login", "secondary full") : `<div class="between">${link("Skip", "create", "text-btn")}${link("Log in", "login", "text-btn")}</div>`}${second ? '<p class="small muted">Joining a team? Open the invite link from your owner.</p>' : ""}</div></main>`;
}

function withdrawalStates() {
  return shell(
    "Withdrawal states",
    `<div class="card">${["Pending", "Waiting for funds", "Processing", "Successful", "Failed, funds returned", "Cancelled"].map((s) => listLink(s, "Simulated state preview", "transaction?id=t2&status=" + encodeURIComponent(s))).join("")}</div>`,
    { back: "states", tabs: false, cls: "narrow" },
  );
}
