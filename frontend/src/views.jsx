import React, { useEffect, useState } from "react";
import { formatMinor } from "../public/money.js";
import {
  brand,
  ico,
  link,
  field,
  notice,
  empty,
  kv,
  status,
  PasswordField,
} from "./ui.jsx";
import {
  AuthFrame,
  Callout,
  CheckEmail,
  VerifyPending,
  VerifyResult,
} from "./authScreens.jsx";

export function createViews({
  state,
  api,
  push,
  can,
  person,
  selectedItems,
  route,
  verify,
}) {
  function shell(
    title,
    body,
    {
      back = "",
      mobileBack = "",
      action = null,
      active = route(),
      cls = "",
      subtitle = "",
      mobileTitle = "",
    } = {},
  ) {
    const nav = [
      ["home", "Home", "navHome"],
      ...(can("sales.allocate") ? [["sales", "Sales", "navSales"]] : []),
      ...(can("catalog.read") ? [["products", "Products", "navProducts"]] : []),
    ];
    const unread = state.notifRead ? 0 : state.payments.length;
    const notifPanel = () => (
      <div className="notif-panel" role="dialog" aria-label="Notifications">
        <div className="notif-head">
          <strong>Notifications</strong>
          <button type="button" className="text-btn" data-live="notifs-read">Mark all as read</button>
          <a href="#/notification-settings" aria-label="Notification settings">{ico("navSettings")}</a>
        </div>
        {state.payments.length ? (
          state.payments.slice(0, 5).map((p) => (
            <a key={p.id} className={"notif-item" + (unread ? " unread" : "")} href="#/sales">
              <span className="po-icon">{ico("cash")}</span>
              <span className="po-text">
                <strong>{formatMinor(p.amountMinor)} payment received</strong>
                <small>Not matched to a sale yet. Record what was sold.</small>
              </span>
              {unread > 0 && <span className="notif-dot" />}
            </a>
          ))
        ) : (
          <p className="notif-empty">You’re all caught up. New payments and low stock alerts will show here.</p>
        )}
      </div>
    );
    const mobileNav = [...nav, ["more", "More", "more"]];
    const moreNav = can("payments.manage")
      ? [
          ["weekly-summary", "Weekly summary", "navWeekly"],
          ["team", "Team", "navTeam"],
          ["business-settings", "Business settings", "navSettings"],
        ]
      : [];
    const navKey =
      {
        wallet: "home",
        subscription: "business-settings",
        "withdrawal-account": "business-settings",
        "connect-paystack": "business-settings",
        "invite-staff": "team",
        onboarding: "business-settings",
        admin: "business-settings",
        "onboarding-managed": "business-settings",
        "onboarding-direct": "business-settings",
      }[
        active
      ] || active;
    const initials =
      (person().name || "A")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .filter((c, i, a) => i === 0 || i === a.length - 1)
        .join("")
        .slice(0, 2)
        .toUpperCase() || "A";
    return (
      <>
        <aside className="sidebar">
          <a
            href="#/home"
            className="sidebar-brand"
            aria-label="Invent IO home"
          >
            {brand()}
            <p>
              {state.tenant?.businessName ||
                api.session?.businessName ||
                "Your business"}
            </p>
          </a>
          <nav className="side-nav">
            {nav.map(([r, t, i]) => (
              <a
                key={r}
                href={`#/${r}`}
                className={navKey === r ? "active" : ""}
                aria-current={navKey === r ? "page" : undefined}
              >
                {ico(i)}
                <span className="nav-label">{t}</span>
                {r === "sales" && state.payments.length > 0 && (
                  <span className="nav-badge">{state.payments.length}</span>
                )}
              </a>
            ))}
            {moreNav.length > 0 && (
              <>
                <span className="side-heading">MORE</span>
                {moreNav.map(([r, t, i]) => (
                  <a
                    key={r}
                    href={`#/${r}`}
                    className={navKey === r ? "active" : ""}
                    aria-current={navKey === r ? "page" : undefined}
                  >
                    {ico(i)}
                    <span className="nav-label">{t}</span>
                  </a>
                ))}
              </>
            )}
          </nav>
          <a className="account-link" href="#/account">
            <span className="avatar">{initials}</span>
            <div>
              <strong>{person().name}</strong>
              <small>
                {state.tenant?.permissions?.includes("*") ? "Owner" : "Staff"} ·
                Account
              </small>
            </div>
          </a>
        </aside>
        <div className="workspace">
          <header
            className={
              "topbar" +
              (["home", "sales", "products"].includes(route()) && !back
                ? " root-header"
                : "")
            }
          >
            <div className="title-group">
              {back && (
                <button
                  className="icon-btn"
                  data-live="go"
                  data-to={back}
                  aria-label="Back"
                >
                  {ico("back")}
                </button>
              )}
              {mobileBack && (
                <button
                  className="icon-btn mob-back"
                  data-live="go"
                  data-to={mobileBack}
                  aria-label="Back"
                >
                  {ico("back")}
                </button>
              )}
              <div>
                <h1>
                  {mobileTitle ? (
                    <>
                      <span className="t-desk">{title}</span>
                      <span className="t-mob">{mobileTitle}</span>
                    </>
                  ) : (
                    title
                  )}
                </h1>
                {subtitle && <p className="topbar-sub">{subtitle}</p>}
              </div>
            </div>
            <div className="chips">
              {can("payments.manage") && (
                <div className="bell-wrap t-desk">
                  <button className="bell-btn" type="button" data-live="toggle-notifs" aria-label="Notifications" aria-expanded={!!state.notifOpen}>
                    <img src="assets/notification.svg" alt="" />
                    {unread > 0 && <span className="bell-badge">{unread}</span>}
                  </button>
                  {state.notifOpen && notifPanel()}
                </div>
              )}
              {action}
              {can("sales.allocate") && ["home", "sales"].includes(route()) && (
                <button
                  className="icon-btn"
                  data-live="go"
                  data-to="record-payment"
                  aria-label="Record payment"
                  title="Record payment"
                >
                  {ico("homePlus")}
                </button>
              )}
            </div>
          </header>
          <main className={`content ${cls}`}>{body}</main>
        </div>
        <nav
          className="bottom-nav live-nav"
          style={{ "--live-nav-count": mobileNav.length }}
        >
          {mobileNav.map(([r, t, i]) => (
            <a
              key={r}
              href={`#/${r}`}
              className={
                active === r ||
                (r === "more" &&
                  [
                    "account",
                    "notification-settings",
                    "onboarding",
                    "admin",
                  ].includes(active))
                  ? "active"
                  : ""
              }
            >
              <span className="bottom-icon">
                {ico(i)}
                {r === "sales" && state.payments.length > 0 && (
                  <span className="bottom-badge">{state.payments.length}</span>
                )}
              </span>
              <span>{t}</span>
            </a>
          ))}
        </nav>
      </>
    );
  }
  function auth(kind) {
    const title = {
      create: "Create account",
      forgot: "Reset password",
      reset: "Set new password",
      login: "Log in",
    }[kind];
    const subtitle = {
      create:
        "Set up your Invent IO account. You\u2019ll be the owner of your business.",
      forgot: "",
      reset: "",
      login: "",
    }[kind];
    const intro =
      kind === "forgot"
        ? "Enter the email you use to log in. We\u2019ll send you a link to reset your password."
        : "";
    const submitLabel = state.submitting
      ? "Please wait\u2026"
      : kind === "forgot"
        ? "Send reset link"
        : kind === "reset"
          ? "Save new password"
          : title;
    const errorLine = (
      <p className="form-error auth-alert" role="alert" id="live-error" />
    );
    const password = kind !== "forgot" && (
      <PasswordField
        name="password"
        label={kind === "reset" ? "New password" : "Password"}
        hint={kind !== "login" ? "At least 8 characters" : ""}
        attrs={{
          required: true,
          autoComplete: kind === "login" ? "current-password" : "new-password",
          ...(kind !== "login" ? { minLength: 8 } : {}),
        }}
        extra={
          kind === "login"
            ? link("Forgot password?", "forgot", "text-btn pw-forgot")
            : null
        }
      />
    );
    return (
      <div className="auth-layout" key={kind}>
        <aside className="auth-brand">
          <a href="#/welcome" aria-label="Invent IO home">
            <span className="brand">
              <span className="brand-mark">
                <span className="icon" aria-hidden="true">
                  <img src="assets/logo-teal.svg" alt="" />
                </span>
              </span>
              <span>Invent IO</span>
            </span>
          </a>
          <div className="auth-brand-copy">
            <h1>Every sale, automatically tracked.</h1>
            <p>
              A customer pays, you tap what they bought — the sale is recorded
              and your stock updates itself.
            </p>
          </div>
        </aside>
        <div className="auth-mobile-header">
          {link(ico("back"), "welcome", "icon-btn")}
          {title}
        </div>
        <main className="auth-main">
          <form
            className="auth-form"
            id="live-auth"
            data-kind={kind}
            noValidate
          >
            {kind === "login" && (
              <div className="auth-form-brand">{brand()}</div>
            )}
            {kind === "login" && errorLine}
            {kind !== "login" && (
              <div className="auth-heading">
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
              </div>
            )}
            {intro && <p className="auth-intro">{intro}</p>}
            {kind === "create" &&
              field(
                "name",
                "Your name",
                "",
                "text",
                "",
                'required autocomplete="name"',
              )}
            {kind !== "reset" &&
              field(
                "email",
                "Email",
                "",
                "email",
                "",
                'required autocomplete="username"',
              )}

             {kind==='create' && field('phone','Phone (optional)','','tel','','autocomplete="tel"')} 
            {password}
            {kind === "create" &&
              link("Forgot password?", "forgot", "text-btn auth-forgot")}
            {kind === "create" &&
              field(
                "businessName",
                "Business name",
                "",
                "text",
                "You can change it later in Business settings",
                "required",
              )}
            {kind === "reset" &&
              field(
                "confirm",
                "Confirm password",
                "",
                "password",
                "",
                'required autocomplete="new-password"',
              )}
            {kind === "login" &&
              link("Forgot password?", "forgot", "text-btn auth-forgot")}
            {kind === "login" && (
              <p className="auth-hint">
                Joining a team? Open the invite link from your owner.
              </p>
            )}
            {kind !== "login" && errorLine}
            <div className="auth-bottom">
              <button
                className="primary"
                type="submit"
                disabled={state.submitting}
              >
                {submitLabel}
              </button>
              {kind !== "forgot" &&
                link(
                  kind === "login"
                    ? "Create account"
                    : kind === "create"
                      ? "Log in instead"
                      : "Back to log in",
                  kind === "login" ? "create" : "login",
                )}
            </div>
          </form>
        </main>
      </div>
    );
  }
  function notificationControls() {
    const support = push.support();
    const denied =
      typeof Notification !== "undefined" &&
      Notification.permission === "denied";
    return (
      <>
        <p className="caption muted">
          {state.pushMessage ||
            (!support.supported
              ? support.message
              : state.enabled
                ? "Notifications enabled on this device."
                : denied
                  ? "Notifications are blocked in browser settings."
                  : "Notifications are off on this device.")}
        </p>
        <div className="chips">
          {support.supported && (
            <>
              <button
                className="secondary"
                data-live={state.pushReady ? "push-enable" : "push-prepare"}
                disabled={denied}
              >
                {state.pushReady
                  ? "Allow notifications"
                  : "Set up notifications"}
              </button>
              <button className="text-btn" data-live="push-disable">
                Turn off notifications
              </button>
            </>
          )}
        </div>
      </>
    );
  }
  const ago = (iso) => {
    const t = Date.parse(iso);
    if (!t) return "\u2014";
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    return m < 1
      ? "Just now"
      : m < 60
        ? m + " min ago"
        : m < 1440
          ? Math.round(m / 60) + " h ago"
          : Math.round(m / 1440) +
            (Math.round(m / 1440) === 1 ? " day ago" : " days ago");
  };
  const pending = (rows) => (
    <div className="pay-table" role="table">
      <div className="pay-row pay-head" role="row">
        <span>Amount</span>
        <span>How they paid</span>
        <span>Customer / recorded by</span>
        <span>Received</span>
        <span>Note</span>
        <span />
      </div>
      {rows.map((p) => {
        const at = p.paidAt || p.createdAt || p.receivedAt;
        const old = at && Date.now() - Date.parse(at) > 864e5;
        return (
          <button
            key={p.id}
            className="pay-row"
            role="row"
            data-live="begin-match"
            data-id={p.id}
          >
            <strong>{formatMinor(p.amountMinor)}</strong>
            <span>
              {[p.method || p.channel, p.provider]
                .filter(Boolean)
                .join(" \u00b7 ") || "\u2014"}
              {(p.providerReference || p.reference) && (
                <small className="pay-ref">
                  {p.providerReference || p.reference}
                </small>
              )}
            </span>
            <span>{p.customerName || p.recordedBy || "\u2014"}</span>
            <span>{ago(at)}</span>
            <span>
              {old ? <span className="pay-old">Over a day old</span> : ""}
            </span>
            <span className="pay-caret">{ico("caret")}</span>
          </button>
        );
      })}
    </div>
  );
  function dashboard() {
    return (
      <>
        {state.coreErrors.length > 0 &&
          notice(
            state.coreErrors.map((error, i) => <p key={i}>{error}</p>),
            "warning",
          )}
        <div className={can("payments.manage") ? "home-grid" : ""}>
        {can("payments.manage") && (
          <section>
            <div className="section-title">
              <h2>Wallet</h2>
            </div>
            <div className="card pad stack-sm wallet-card">
              <span className="caption muted">Available balance</span>
              <strong className="money-lg">{"\u2014"}</strong>
              <span className="caption muted">Ready to withdraw now</span>
              <div className="kv-row">
                <span>Total received (all time)</span>
                <strong>{"\u2014"}</strong>
              </div>
              <button className="primary" type="button" data-live="withdraw">
                Withdraw
              </button>
            </div>
            <p className="sim-tag">{ico("info")} Simulated · test mode, no real money moves</p>
          </section>
        )}
        {state.summary && (
          <section>
            <div className="section-title">
              <h2>Today’s sales</h2>
              {link("View sales", "sales")}
            </div>
            <div className="card daily">
              <strong className="money-lg">
                {formatMinor(state.summary.revenue)}
              </strong>
              <div className="daily-details">
                <span>{state.summary.salesCount} sales</span>
                <span className="profit">
                  <strong>{formatMinor(state.summary.margin)}</strong>Profit
                </span>
              </div>
            </div>
          </section>
        )}
        </div>
        {can("sales.allocate") && (
          <section>
            <div className="section-title">
              <h2>Pending payments</h2>
              {state.payments.length > 0 ? (
                link("View all (" + state.payments.length + ")", "sales")
              ) : (
                <button className="text-btn" data-live="refresh-core">
                  Refresh
                </button>
              )}
            </div>
            {state.payments.length ? (
              <>
                {pending(state.payments.slice(0, 3))}
                <p className="caption muted">
                  Select a row to record what was sold. Pending payments don’t
                  count in sales until products are recorded.
                </p>
              </>
            ) : (
              empty(
                "No pending payments",
                "Confirmed payments waiting for products will appear here.",
              )
            )}
          </section>
        )}
      </>
    );
  }
  function home() {
    const day = new Date().toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const biz = state.tenant?.businessName || api.session?.businessName;
    return shell(
      "Home",
      <div className="stack">
        {dashboard()}
        {state.catalogError && notice(state.catalogError, "warning")}
      </div>,
      {
        subtitle: (
          <>
            {biz && (
              <span className="t-desk">
                {biz} {"\u00b7"}{" "}
              </span>
            )}
            {day}
          </>
        ),
        mobileTitle: biz || "Home",
      },
    );
  }
  function catalogRows(rows) {
    return rows.map((p) => (
      <a
        key={p.id}
        className="list-link"
        href={`#/catalog-edit?id=${encodeURIComponent(p.id)}`}
      >
        <span className="product-placeholder">{ico("package")}</span>
        <div className="grow">
          <strong>{p.name}</strong>
          <p>
            {formatMinor(p.price)}
            {p.cost != null ? " · cost " + formatMinor(p.cost) : ""}
            {p.sku ? " · " + p.sku : ""}
          </p>
        </div>
        {ico("caret")}
      </a>
    ));
  }
  function catalogTable(rows) {
    return (
      <div className="pay-table prod-table" role="table">
        <div className="pay-row pay-head" role="row">
          <span>Product</span>
          <span className="num">Selling price</span>
          <span className="num">Cost price</span>
          <span />
        </div>
        {rows.map((p) => (
          <a
            key={p.id}
            className="pay-row prod-row"
            role="row"
            href={`#/catalog-edit?id=${encodeURIComponent(p.id)}`}
          >
            <span className="prod-name">
              <span className="product-placeholder">{ico("package")}</span>
              <span className="prod-text">
                <strong>{p.name}</strong>
                <span className="prod-sub">
                  {formatMinor(p.price)}
                  {p.cost != null ? " \u00b7 cost " + formatMinor(p.cost) : ""}
                </span>
              </span>
            </span>
            <span className="num">{formatMinor(p.price)}</span>
            <span className="num">
              {p.cost != null ? formatMinor(p.cost) : "\u2014"}
            </span>
            <span>
              {p.cost == null && <span className="pay-old">Cost not set</span>}
            </span>
          </a>
        ))}
      </div>
    );
  }
  function products() {
    const q = (state.search || "").toLowerCase();
    const all = state.products.filter((p) => p.name.toLowerCase().includes(q));
    const active = all.filter((p) => p.active !== false);
    const noCost = active.filter((p) => p.cost == null);
    const archived = all.filter((p) => p.active === false);
    const rows =
      state.productFilter === "nocost"
        ? noCost
        : state.productFilter === "archived"
          ? archived
          : active;
    return shell(
      "Products",
      <>
        <div className="toolbar">
          <label className="search">
            {ico("search")}
            <input
              id="live-search"
              type="search"
              value={state.search || ""}
              onChange={() => {}}
              placeholder="Search products"
              aria-label="Search products"
            />
          </label>
          {can("catalog.write") && (
            <a className="secondary add-mobile" href="#/catalog-new">
              + Add product
            </a>
          )}
          <div className="chip-row">
            {chip("productFilter", "all", "All")}
            {noCost.length > 0 &&
              chip(
                "productFilter",
                "nocost",
                "Cost not set (" + noCost.length + ")",
              )}
            {archived.length > 0 &&
              chip("productFilter", "archived", "Archived")}
          </div>
          <span className="chip-gap" />
          {can("catalog.write") && link("Import CSV", "import", "secondary")}
        </div>
        {state.catalogError && notice(state.catalogError, "warning")}
        <div id="live-catalog">
          {rows.length ? (
            <>
              {catalogTable(rows)}
              <p className="caption muted">Select a product to open it.</p>
            </>
          ) : (
            <div className="card">
              {empty(
                state.search ? "No matching products" : "No products yet",
                state.search
                  ? "Try another search."
                  : "Add your products one by one, or import an existing spreadsheet as CSV.",
                can("catalog.write")
                  ? link("Import CSV", "import", "primary")
                  : null,
              )}
            </div>
          )}
        </div>
      </>,
      {
        active: "products",
        action: can("catalog.write") ? (
          <a className="primary add-product" href="#/catalog-new">
            + Add product
          </a>
        ) : null,
      },
    );
  }
  function importResult() {
    const r = state.result;
    return (
      <section className="card pad stack-sm" role="status">
        <h2>Import complete</h2>
        <div className="summary-grid">
          {[
            ["Created", r.created],
            ["Updated", r.updated],
            ["Skipped", r.skipped],
          ].map(([label, n]) => (
            <div key={label}>
              <span>{label}</span>
              <strong className="money-lg">{n}</strong>
            </div>
          ))}
        </div>
        {r.errors.length ? (
          <>
            <p className="caption">
              Fix the skipped data rows below before importing again. Row
              numbers exclude the header. Don’t re-import successful rows
              without SKUs.
            </p>
            <ul>
              {r.errors.map((e, i) => (
                <li key={i} className="caption">
                  Data row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>All rows were imported.</p>
        )}
        {link("View catalog", "products", "primary")}
      </section>
    );
  }
  function importScreen() {
    const batch = state.csv;
    return shell(
      "Import products",
      <div className="stack">
        <section className="card pad stack-sm">
          <h2>Bring your existing catalog</h2>
          <p className="muted">
            Export your spreadsheet as CSV. Required columns:{" "}
            <strong>name, price, cost</strong>. Optional: sku, barcode, unit.
          </p>
          <a className="text-btn" href="catalog-template.csv" download>
            Download CSV template (naira)
          </a>
          <label className="field">
            CSV file
            <input
              id="live-csv"
              type="file"
              accept=".csv,text/csv"
              disabled={state.importing}
            />
            <span className="hint">
              Up to 5,000 rows and 2 MB. Excel files must be exported as CSV.
            </span>
          </label>
          <label className="field">
            Price and cost in your file
            <select
              id="live-units"
              value={state.units}
              onChange={() => {}}
              disabled={state.importing}
            >
              <option value="naira">Naira — 1500 means ₦1,500</option>
              <option value="kobo">Kobo — 150000 means ₦1,500</option>
            </select>
          </label>
          <p className="form-error" id="import-error" role="alert" />
          {batch && (
            <>
              <p>
                <strong>{state.fileName}</strong> · {batch.preview.length} rows
                ready
              </p>
              {batch.withoutSku
                ? notice(
                    `${batch.withoutSku} rows have no SKU. Importing those rows again creates additional products; it does not update them.`,
                    "warning",
                  )
                : notice(
                    "Matching SKUs update existing products. Review the file before importing.",
                  )}
              {batch.ignoredColumns.length > 0 &&
                notice(
                  "These columns will not be imported: " +
                    batch.ignoredColumns.join(", ") +
                    ". Stock quantities are not imported by this endpoint.",
                  "warning",
                )}
              <div className="import-preview">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.preview.slice(0, 5).map((p, i) => (
                      <tr key={i}>
                        <td>{p.name}</td>
                        <td>{p.sku || "—"}</td>
                        <td>{formatMinor(p.price)}</td>
                        <td>{formatMinor(p.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="small muted">
                Preview shows the first {Math.min(5, batch.preview.length)}{" "}
                rows. Prices are converted to integer kobo before upload.
              </p>
              <button
                className="primary"
                data-live="import-submit"
                disabled={state.importing}
              >
                {state.importing
                  ? "Importing…"
                  : `Import ${batch.preview.length} products`}
              </button>
            </>
          )}
        </section>
        {state.result && importResult()}
      </div>,
      { back: "products", active: "products", cls: "medium" },
    );
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
        "Products",
        p ? (
          <div className="card">
            {kv("Name", p.name)}
            {kv("Selling price", formatMinor(p.price))}
            {kv("SKU", p.sku || "—")}
          </div>
        ) : (
          empty(
            "You don’t have access",
            "Ask your business owner to add products.",
          )
        ),
        { back: "products" },
      );
    const decimal = (x) => {
      const n = BigInt(x ?? 0);
      return n / 100n + "." + (n % 100n).toString().padStart(2, "0");
    };
    return shell(
      p ? "Edit product" : "Add product",
      <form
        key={(id || "new") + state.formNonce}
        id="live-product"
        data-id={id || ""}
        className="card pad prod-form"
        noValidate
      >
        {field("name", "Product name", p?.name || "", "text", "", "required")}
        <div className="pair">
          {field(
            "price",
            "Selling price (₦)",
            p ? decimal(p.price) : "",
            "text",
            "",
            'required inputmode="decimal"',
          )}
          {field(
            "cost",
            "Cost price (₦)",
            p ? decimal(p.cost) : "",
            "text",
            "Used to work out your profit.",
            'required inputmode="decimal"',
          )}
        </div>
        {field("sku", "SKU (optional)", p?.sku || "")}
        <p className="form-error" id="live-error" />
        <div className="form-actions">
          {!p && (
            <button className="secondary" type="submit" data-again="1">
              Save &amp; add another
            </button>
          )}
          <button className="primary" type="submit">
            Save
          </button>
        </div>
      </form>,
      { back: "products", active: "products", cls: "form880" },
    );
  }
  function accountCard() {
    const a = state.managed;
    return (
      <section className="card pad stack-sm">
        <h2>Payment account</h2>
        {state.accountError ? (
          notice(state.accountError, "warning")
        ) : a ? (
          <>
            <div className="between">
              <span>Status</span>
              {status(a.status, a.status === "ACTIVE" ? "good" : "warn")}
            </div>
            {(a.virtualAccounts || []).map((v) => (
              <div className="card" key={v.id || v.accountNumber}>
                {kv("Bank", v.bankName)}
                {kv("Account name", v.accountName)}
                {kv("Account number", v.accountNumber)}
                {kv("Account status", v.status)}
              </div>
            ))}
            {!a.virtualAccounts?.length &&
              notice(
                "Your account setup is not complete. Continue with the same settlement details to resume.",
                "warning",
              )}
          </>
        ) : (
          <p className="muted">No managed account is set up yet.</p>
        )}
        <p className="small muted">
          Paystack test mode · account setup does not mean live payments or
          withdrawals are enabled.
        </p>
        {link(
          a && !a.virtualAccounts?.length ? "Continue setup" : "Payment setup",
          "onboarding",
          "secondary",
        )}
        <button className="text-btn" data-live="refresh-account">
          Refresh status
        </button>
      </section>
    );
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
      <div className="stack">
        <section className="card pad stack-sm">
          <h2>Do you have a Paystack account?</h2>
          <p className="muted">
            Choose how your business will receive payments.
          </p>
          <div className="chips">
            {link("Yes, I have Paystack", "onboarding-direct", "secondary")}
            {link("No, help me set up", "onboarding-managed", "primary")}
          </div>
        </section>
        {accountCard()}
        {can("catalog.write") &&
          link("Import your products from CSV", "import")}
      </div>,
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
      <form id="live-managed" className="card pad stack" noValidate>
        {notice(
          "This sets up a Paystack test account for your business. It doesn’t switch on live payments.",
        )}
        <div className="form-grid">
          {field(
            "businessName",
            "Registered business name",
            api.session?.businessName || "",
            "text",
            "",
            'required minlength="2"',
          )}
          {field(
            "ownerName",
            "Owner’s full name",
            api.session?.name || "",
            "text",
            "",
            'required minlength="2"',
          )}
          {field(
            "ownerEmail",
            "Owner’s email",
            person().email,
            "email",
            "",
            "required",
          )}
          {field("ownerPhone", "Phone (optional)", "", "tel")}
          {field(
            "customerFirstName",
            "Customer first name",
            "",
            "text",
            "",
            "required",
          )}
          {field(
            "customerLastName",
            "Customer last name",
            "",
            "text",
            "",
            "required",
          )}
          {field(
            "settlementBankCode",
            "Settlement bank code",
            "",
            "text",
            "Use the Paystack bank code supplied by your bank/setup team.",
            'required inputmode="numeric" pattern="[0-9]{3,5}"',
          )}
          {field(
            "settlementAccountNumber",
            "Settlement account number",
            "",
            "text",
            "",
            'required inputmode="numeric" pattern="[0-9]{8,20}" autocomplete="off"',
          )}
        </div>
        <label className="consent">
          <input type="checkbox" name="ownerConsent" required /> I am authorized
          to submit these business, contact and settlement account details to
          Invent IO and Paystack for account setup.
        </label>
        <p className="small muted">
          Settlement account numbers are sent securely and are not saved in this
          browser.
        </p>
        <p className="form-error" id="live-error" />
        <button className="primary" type="submit">
          Create test payment account
        </button>
      </form>,
      { back: "onboarding", cls: "medium" },
    );
  }
  function direct() {
    return shell(
      "Connect your Paystack account",
      <div className="card pad stack">
        <h2>Your money stays with your bank</h2>
        <p className="muted">
          Your own Paystack account receives payments directly. A managed wallet
          is not required.
        </p>
        {notice(
          "Connecting your own Paystack account isn’t available yet.",
          "warning",
        )}
        <p className="caption">
          Do not paste a Paystack secret into an unsecured form or chat. This
          page does not collect or store it.
        </p>
        {link("Back to payment options", "onboarding", "secondary")}
      </div>,
      { back: "onboarding", cls: "narrow" },
    );
  }
  function changePassword() {
    return shell(
      "Change password",
      <form id="live-change-password" className="card pad stack" noValidate>
        {field(
          "currentPassword",
          "Current password",
          "",
          "password",
          "",
          'required autocomplete="current-password"',
        )}
        {field(
          "newPassword",
          "New password",
          "",
          "password",
          "At least 8 characters",
          'required minlength="8" autocomplete="new-password"',
        )}
        {field(
          "confirm",
          "Confirm new password",
          "",
          "password",
          "",
          'required autocomplete="new-password"',
        )}
        <p className="form-error" id="live-error" role="alert" />
        <button className="primary" type="submit">
          Save password
        </button>
      </form>,
      { back: "account", cls: "narrow" },
    );
  }
  function account() {
    const biz = state.tenant?.businessName || api.session?.businessName;
    const role = state.tenant?.permissions?.includes("*") ? "Owner" : "Staff";
    const row = (label, value) => (
      <div className="acct-row">
        <span className="acct-label">{label}</span>
        <strong>{value || "\u2014"}</strong>
      </div>
    );
    return shell(
      "Account",
      <section className="card acct-card">
        {row("Name", person().name)}
        {row("Email", person().email)}
        {row("Role", [role, biz].filter(Boolean).join(" \u00b7 "))}
        <a
          className="acct-row acct-link acct-notif"
          href="#/notification-settings"
        >
          <span>
            <strong>Notifications</strong>
            <span className="acct-label">
              Browser alerts for payments and stock
            </span>
          </span>
          {ico("caret")}
        </a>
        <p className="caption muted acct-note">
          To change your password, use “Forgot password” on the log-in screen.
        </p>
        <div className="acct-actions">
          <button className="text-btn acct-logout" data-live="logout">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.500v9A1.500 1.500 0 0 0 5.500 16H8M12.500 6.500 16 10l-3.500 3.500M16 10H8" />
            </svg>
            Log out
          </button>
        </div>
      </section>,
      { cls: "narrow", mobileBack: "more" },
    );
  }
  function moreScreen() {
    const r = (to, label, sub) => (
      <a className="acct-row acct-link" href={`#/${to}`}>
        <span>
          <strong>{label}</strong>
          {sub && <span className="acct-label">{sub}</span>}
        </span>
        {ico("caret")}
      </a>
    );
    return shell(
      "More",
      <section className="card acct-card">
        {r("account", "Account", person().email)}
        {r(
          "notification-settings",
          "Notifications",
          "Browser alerts for payments and stock",
        )}
        {can("payments.manage") && r("onboarding", "Payment setup")}
        {can("payments.manage") && r("admin", "Account overview")}
        <div className="acct-actions">
          <button className="text-btn acct-logout" data-live="logout">
            Log out
          </button>
        </div>
      </section>,
      { active: "more", cls: "narrow" },
    );
  }
  function notificationSettings() {
    return shell(
      "Notifications",
      <section className="card pad stack-sm">
        <h2>Browser alerts</h2>
        <p className="caption muted">
          Payment and low-stock alerts reach this device after you allow
          notifications.
        </p>
        {notificationControls()}
      </section>,
      { back: "account", active: "account", cls: "narrow" },
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
      <div className="stack">
        {accountCard()}
        {link("Merchant self-onboarding", "onboarding", "primary")}
      </div>,
      { back: "home", cls: "narrow" },
    );
  }
  function paymentRows(rows) {
    return rows.length ? (
      <div className="card">
        {rows.map((p) => (
          <button
            key={p.id}
            className="list-link"
            data-live="begin-match"
            data-id={p.id}
          >
            <span className="payment-method">{ico("homeTransfer")}</span>
            <div className="grow">
              <strong>{formatMinor(p.amountMinor)}</strong>
              <p>
                {p.method || p.channel || p.provider || "Payment"} ·{" "}
                {p.providerReference || p.reference || ""}
              </p>
            </div>
            {ico("caret")}
          </button>
        ))}
      </div>
    ) : (
      empty(
        "No pending payments",
        "Confirmed payments waiting for products will appear here.",
      )
    );
  }
  const chip = (key, value, label) => (
    <button
      key={value}
      className={"chip-filter" + (state[key] === value ? " on" : "")}
      data-live="set-ui"
      data-key={key}
      data-value={value}
      aria-pressed={state[key] === value}
    >
      {state[key] === value && (
        <span className="chip-check" aria-hidden="true">
          {"\u2713"}
        </span>
      )}
      {label}
    </button>
  );
  const payAt = (p) => Date.parse(p.paidAt || p.createdAt || p.receivedAt) || 0;
  const inRange = (iso, range) => {
    const t = Date.parse(iso);
    if (!t) return false;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = 864e5;
    const from = {
      today: d.getTime(),
      yesterday: d.getTime() - day,
      week: d.getTime() - ((d.getDay() + 6) % 7) * day,
    }[range];
    const to = range === "yesterday" ? d.getTime() : Infinity;
    return t >= from && t < to;
  };
  function salesScreen() {
    const pendingList = [...state.payments].sort((x, y) =>
      state.salesSort === "oldest" ? payAt(x) - payAt(y) : payAt(y) - payAt(x),
    );
    const recorded = state.sales.filter((x) =>
      inRange(x.createdAt, state.salesRange),
    );
    const hhmm = (iso) =>
      iso
        ? new Date(iso).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "\u2014";
    const itemsText = (x) =>
      (x.items || [])
        .map(
          (i) =>
            (state.products.find((p) => p.id === i.productId)?.name ||
              "Product") +
            " \u00d7" +
            i.qty,
        )
        .join(", ") || "\u2014";
    return shell(
      "Sales",
      <div className="stack">
        <div className="chip-row">
          {chip(
            "salesTab",
            "pending",
            "Pending payments (" + state.payments.length + ")",
          )}
          {can("reports.view") && chip("salesTab", "recorded", "Recorded")}
          <span className="chip-gap" />
          {state.salesTab === "pending" ? (
            <>
              <span className="chip-label">Sort</span>
              {chip("salesSort", "oldest", "Oldest first")}
              {chip("salesSort", "newest", "Newest first")}
            </>
          ) : (
            <>
              {chip("salesRange", "today", "Today")}
              {chip("salesRange", "yesterday", "Yesterday")}
              {chip("salesRange", "week", "This week")}
            </>
          )}
        </div>
        {state.coreErrors.map((e, i) => (
          <React.Fragment key={i}>{notice(e, "warning")}</React.Fragment>
        ))}
        {state.salesTab === "pending" || !can("reports.view") ? (
          pendingList.length ? (
            <>
              <div className="pay-table sales-table" role="table">
                <div className="pay-row pay-head" role="row">
                  <span>Amount</span>
                  <span>How they paid</span>
                  <span>Customer / recorded by</span>
                  <span>Received</span>
                  <span>Note</span>
                  <span />
                </div>
                {pendingList.map((p) => {
                  const at = p.paidAt || p.createdAt || p.receivedAt;
                  const old = at && Date.now() - Date.parse(at) > 864e5;
                  return (
                    <div key={p.id} className="pay-row" role="row">
                      <strong>{formatMinor(p.amountMinor)}</strong>
                      <span>
                        {[p.method || p.channel, p.provider]
                          .filter(Boolean)
                          .join(" \u00b7 ") || "\u2014"}
                        {(p.providerReference || p.reference) && (
                          <small className="pay-ref">
                            {p.providerReference || p.reference}
                          </small>
                        )}
                      </span>
                      <span>{p.customerName || p.recordedBy || "\u2014"}</span>
                      <span>{ago(at)}</span>
                      <span>
                        {old ? (
                          <span className="pay-old">Over a day old</span>
                        ) : (
                          ""
                        )}
                      </span>
                      <button
                        className="secondary pay-cta"
                        data-live="begin-match"
                        data-id={p.id}
                      >
                        + What did you sell?
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="caption muted">
                Oldest first so nothing is missed. Pending payments don’t count
                in sales until products are recorded.
              </p>
            </>
          ) : (
            empty(
              "No pending payments",
              "Confirmed payments waiting for products will appear here.",
            )
          )
        ) : recorded.length ? (
          <div className="pay-table sale-rows" role="table">
            <div className="pay-row pay-head" role="row">
              <span>Amount</span>
              <span>Items</span>
              <span>Time</span>
              <span>Status</span>
            </div>
            {recorded.map((x) => (
              <a
                key={x.id}
                className="pay-row"
                role="row"
                href={`#/sale-detail?id=${encodeURIComponent(x.id)}`}
              >
                <strong>{formatMinor(x.total)}</strong>
                <span className="pay-items">{itemsText(x)}</span>
                <span>{hhmm(x.createdAt)}</span>
                <span>
                  {x.flagged
                    ? status("Review difference", "warn")
                    : status("Recorded", "good")}
                </span>
              </a>
            ))}
          </div>
        ) : (
          empty(
            "No recorded sales",
            "Confirmed sales for this period will appear here.",
          )
        )}
      </div>,
    );
  }
  function saleDetail(id) {
    const sale = state.sales.find((s) => s.id === id);
    if (!sale)
      return shell(
        "Sale",
        empty("Sale not found", "Open Recorded sales and refresh the list."),
        { back: "sales" },
      );
    return shell(
      "Sale detail",
      <div className="stack">
        <section className="card pad stack-sm">
          <h2>Recorded sale</h2>
          {kv("Recorded", new Date(sale.createdAt).toLocaleString())}
          {kv("Total", formatMinor(sale.total))}
          {can("reports.view") && kv("Profit", formatMinor(sale.margin))}
          {kv("Difference", formatMinor(sale.variance || 0))}
        </section>
        <div className="card">
          {(sale.items || []).map((i, index) => (
            <div key={i.id || index} className="list-link">
              <div className="grow">
                <strong>
                  {state.products.find((p) => p.id === i.productId)?.name ||
                    "Product"}
                </strong>
                <p>
                  {i.qty} × {formatMinor(i.unitPrice)}
                </p>
              </div>
              <strong>
                {formatMinor(BigInt(i.unitPrice) * BigInt(i.qty))}
              </strong>
            </div>
          ))}
        </div>
      </div>,
      { back: "sales", cls: "narrow" },
    );
  }
  function recordPayment() {
    if (!can("sales.allocate"))
      return shell(
        "Record payment",
        empty(
          "You don’t have access",
          "Ask your business owner for permission to record sales.",
        ),
      );
    const branches = state.tenant?.branches || [];
    return shell(
      "Record payment",
      <form id="live-cash-payment" className="card pad stack record-form" noValidate>
        <div>
          <h2>Record payment</h2>
          <p className="caption muted">
            Enter what the customer paid. You’ll pick the products next.
          </p>
        </div>
        <label className="field amount-field">
          <span>Amount received</span>
          <input
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="₦0"
            autoComplete="off"
            required
          />
        </label>
        {!state.tenant?.branchId &&
          branches.length > 1 && (
            <label className="field">
              Branch
              <select name="branchId" required>
                {branches.map((b) => (
                  <option value={b.id} key={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        {!state.tenant?.branchId && branches.length === 1 && (
          <input type="hidden" name="branchId" value={branches[0].id} />
        )}
        {!state.tenant?.branchId && !branches.length &&
          notice(
            "We couldn’t find your branch. Log out and log in again, then try once more.",
            "warning",
          )}
        <div className="stack-sm">
          <span className="field-label">How did they pay?</span>
          <div className="chip-row">
            {["Cash", "Transfer", "Card"].map((m, i) => (
              <label className="chip" key={m}>
                <input type="radio" name="method" value={m.toLowerCase()} defaultChecked={i === 0} />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </div>
        {field("customer", "Customer name (optional)", "", "text", "", 'placeholder="Ada O."')}
        <p className="form-error" id="live-error" role="alert" />
        <button
          className="primary"
          type="submit"
          disabled={!state.tenant?.branchId && !branches.length}
        >
          Continue
        </button>
      </form>,
      { back: "sales", cls: "narrow" },
    );
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
        (sum, i) => sum + BigInt(i.product.price) * BigInt(i.qty),
        0n,
      ),
      difference = BigInt(p.amountMinor) - total;
    return shell(
      "What did you sell?",
      <div className="selection-grid">
        <section className="card pad stack-sm">
          <div className="payment-summary">
            <strong className="money-lg">{formatMinor(p.amountMinor)}</strong>
            <p className="caption muted">
              {p.providerReference || p.reference || "Confirmed payment"}
            </p>
          </div>
          {state.catalogError && notice(state.catalogError, "warning")}
          <div className="product-picker">
            {state.products
              .filter((p) => p.active !== false)
              .map((p) => (
                <div
                  key={p.id}
                  className={`pick-card ${state.quantities[p.id] ? "selected" : ""}`}
                >
                  <div className="grow">
                    <h3>{p.name}</h3>
                    <span className="caption">{formatMinor(p.price)}</span>
                  </div>
                  <div className="quantity">
                    {state.quantities[p.id] > 0 && (
                      <>
                        <button
                          data-live="live-quantity"
                          data-id={p.id}
                          data-delta="-1"
                          aria-label={`Remove one ${p.name}`}
                          disabled={state.allocating}
                        >
                          −
                        </button>
                        <strong>{state.quantities[p.id]}</strong>
                      </>
                    )}
                    <button
                      className={state.quantities[p.id] ? "" : "quantity-add"}
                      data-live="live-quantity"
                      data-id={p.id}
                      data-delta="1"
                      aria-label={`Add one ${p.name}`}
                      disabled={state.allocating}
                    >
                      {state.quantities[p.id] ? "+" : "+ Add"}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
        <section className="card pad stack-sm">
          <h2>Review sale</h2>
          {kv("Products total", formatMinor(total))}
          {kv("Paid", formatMinor(p.amountMinor))}
          {difference !== 0n
            ? notice(
                "Difference: " +
                  formatMinor(difference) +
                  ". Discounts and tips are allowed. The server records and flags the variance.",
                "warning",
              )
            : notice("Matches the payment.")}
          <p className="form-error" id="allocate-error" role="alert" />
          <button
            className="primary"
            data-live="allocate"
            disabled={!items.length || state.allocating}
          >
            {state.allocating ? "Confirming…" : "Confirm sale"}
          </button>
          <p className="small muted">
            The server updates stock when the sale is confirmed. Negative stock
            is allowed and flagged.
          </p>
        </section>
      </div>,
      { back: "sales" },
    );
  }

  function setupBusiness() {
  return <AuthFrame title="Set up your business" back="home">
    <h1 className="auth-title desktop-only">Set up your business</h1>
    <p className="step-label">STEP 1 OF 3</p>
    <p className="status-text">Where should your weekly summary of sales and stock go?</p>
    <form id="live-setup-business" className="stack" noValidate>
      {field('whatsapp','WhatsApp number',state.setup?.whatsapp||'','tel','0803… or +234…','autocomplete="tel"')}
      {field('summaryEmail','Email for weekly summary',state.setup?.summaryEmail||person().email,'email','From your account — change it if you like')}
      <p className="form-error" id="live-error" role="alert"/>
      <div className="auth-bottom">
        <button className="primary" type="submit">Continue</button>
        <button type="button" className="text-btn" data-live="go" data-to="setup-payments">Skip WhatsApp for now</button>
      </div>
    </form>
  </AuthFrame>;
}
function setupPayments() {
  const sel = state.setup?.payments || "paystack";
  const opts = [
    ["paystack", "I have a Paystack account", "Connect it so card and transfer payments show here. Money goes straight to your bank.", "homeCash"],
    ["collection", "Use Invent IO collection", "Invent IO collects payments for you. You withdraw to your bank.", "featureBank"],
    ["later", "Not now", "Record cash and transfers yourself. Set this up later in Business settings.", "cash"],
  ];
  return <AuthFrame title="Set up your business" back="setup-business">
    <h1 className="auth-title desktop-only">Set up your business</h1>
    <p className="step-label">STEP 2 OF 3</p>
    <p className="status-text">How do your customers pay you?</p>
    <form id="live-setup-payments" className="stack" noValidate>
      <div className="pay-options">
        {opts.map(([v, t, d, i]) => (
          <label className="pay-option" key={v}>
            <input type="radio" name="payments" value={v} defaultChecked={sel === v} />
            <span className="po-icon">{ico(i)}</span>
            <span className="po-text"><strong>{t}</strong><small>{d}</small></span>
            <span className="po-radio" />
          </label>
        ))}
      </div>
      <div className="auth-bottom">
        <button className="primary" type="submit">Continue</button>
      </div>
    </form>
  </AuthFrame>;
}
function setupProducts() {
  const n=state.setupCount||0;
  return <AuthFrame title="Add your products" back="setup-payments">
    <h1 className="auth-title desktop-only">Add your products</h1>
    <p className="step-label">STEP 3 OF 3</p>
    {n>0 && <p className="status-text">{n===1?'1 product added.':`${n} products added.`} Add another, or continue.</p>}
    <Callout tone="info" title="Add the products you sell">Add what you sell now, or any time later. You can start recording payments either way.</Callout>
    <form key={state.formNonce} id="live-setup-product" className="stack" noValidate>
      {field('name','Product name','','text','','required placeholder="e.g. Shea butter 250g"')}
      {field('price','Selling price (₦)','','text','','required inputmode="decimal" placeholder="e.g. 2,000"')}
      {field('cost','Cost price (₦)','','text','Used to work out your profit.','required inputmode="decimal" placeholder="e.g. 1,400"')}
      {field('stock','Stock you have now','','text','','required inputmode="numeric" placeholder="e.g. 20"')}
      {field('threshold','Low-stock alert at','','text','We’ll mark it Low at this number or fewer','required inputmode="numeric" placeholder="e.g. 5"')}
      <p className="form-error" id="live-error" role="alert"/>
      <div className="auth-bottom">
        <button className="primary" type="submit" data-again="1">Save &amp; add another</button>
        <button className="secondary" type="submit">Save &amp; continue</button>
        <button type="button" className="text-btn" data-live="go" data-to="setup-done">I’ll do this later</button>
      </div>
    </form>
  </AuthFrame>;
}
function setupDone() {
  const biz=state.tenant?.businessName||api.session?.businessName||'Your business';
  const n=state.setupCount||0;
  return <AuthFrame title={biz+' is ready'} bigTitle>
    <h1 className="auth-title desktop-only">{biz}</h1>
    <div className="setup-done">
      <div className="done-head">
        <span className="done-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m8 12.3 2.8 2.8L16.2 9.5" /></svg></span>
        <h2>{biz} is ready</h2>
        {n>0 && <p className="done-meta">{n===1?'1 product added':`${n} products added`}</p>}
      </div>
      <p className="status-text">When a customer pays, tap Record payment and choose what they bought. Invent IO records the sale and updates your stock.</p>
      <p className="done-note">You can add more products, invite staff and change settings any time.</p>
    </div>
    <div className="auth-bottom">{link('Go to Home','home','primary')}</div>
  </AuthFrame>;
}

  function ownerOnly(title, body, opts) {
    if (!can("payments.manage"))
      return shell(
        title,
        empty("You don’t have access", "Ask your business owner for access."),
      );
    return shell(title, body, opts);
  }
  function weeklySummary() {
    const dash = "\u2014";
    return ownerOnly(
      "Weekly summary",
      <div className="card pad stack wk-card">
        <p className="caption">Last week</p>
        <div className="wk-stats">
          <div className="card pad-sm">
            <span className="caption muted">Sales</span>
            <strong className="money-lg">{dash}</strong>
            <span className="caption muted">Not available yet</span>
          </div>
          <div className="card pad-sm">
            <span className="caption muted">Pending payments</span>
            <strong className="money-lg">{state.payments.length}</strong>
            <span className="caption muted">
              {state.payments.length ? "Waiting for products" : "All recorded"}
            </span>
          </div>
        </div>
        {state.payments.length > 0 &&
          notice(
            <>
              {state.payments.length} payment
              {state.payments.length === 1 ? " is" : "s are"} still pending.
              Record what was sold so they count in your sales.{" "}
              {link("Review pending payments", "sales")}
            </>,
            "warning",
          )}
        <p className="step-label">TOP PRODUCTS</p>
        <div className="card pad-sm caption muted">
          Top sellers will show here once your first week of sales is in.
        </div>
        <p className="step-label">LOW STOCK</p>
        <div className="card pad-sm caption muted">
          Nothing is running low.
        </div>
        <p className="step-label">SENT TO YOU</p>
        <div className="card">
          <div className="kv"><span>WhatsApp</span><strong>Not sent yet</strong></div>
          <div className="kv"><span>Email</span><strong>Not sent yet</strong></div>
        </div>
        <p className="caption muted">
          Voided sales and payments marked Not a sale are not counted.
        </p>
      </div>,
      { cls: "narrow" },
    );
  }
  function team() {
    const ini = (person().name || "A")
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter((c, i, a) => i === 0 || i === a.length - 1)
      .join("")
      .toUpperCase();
    return ownerOnly(
      "Team",
      <div className="stack">
        <div className="pay-table team-table" role="table">
          <div className="pay-row pay-head" role="row">
            <span>Name</span>
            <span>Role and access</span>
          </div>
          <div className="pay-row" role="row">
            <span className="prod-name">
              <span className="avatar">{ini}</span>
              <strong>{person().name}</strong>
            </span>
            <span>Owner · you</span>
          </div>
        </div>
        <p className="caption muted">
          Only you can invite or remove staff and change what they can do.
        </p>
      </div>,
      {
        action: (
          <button
            className="primary"
            type="button"
            data-live="invite-staff"
          >
            {ico("invite")} Invite staff
          </button>
        ),
      },
    );
  }
  function inviteStaff() {
    return ownerOnly(
      "Invite staff",
      <div className="card pad stack">
        <p className="muted">Share this link with your staff member. It works once and expires in 7 days.</p>
        <label className="field">Invite link
          <input type="text" readOnly disabled placeholder="Your invite link will appear here" />
        </label>
        {notice(<><strong>What they can do at first</strong><br />Record sales and View inventory. You can change this in Team after they join.</>, "info")}
        <div className="form-actions">
          <button className="secondary" type="button" data-live="invite-unavailable">Copy link</button>
          <button className="primary" type="button" data-live="invite-unavailable">Share on WhatsApp</button>
        </div>
      </div>,
      { back: "team", cls: "narrow" },
    );
  }

  function subscription() {
    const n = state.products.filter((x) => x.active !== false).length;
    const bar = (label, used, max) => (
      <div className="usage">
        <div className="usage-row"><span>{label}</span><strong>{used} of {max}</strong></div>
        <div className="usage-bar"><span style={{ width: Math.min(100, (used / max) * 100) + "%" }} /></div>
      </div>
    );
    return ownerOnly(
      "Subscription",
      <div className="card pad stack">
        <div className="card pad-sm stack-sm">
          <div className="kv-row nob"><strong>Free</strong><strong>{"\u20A6"}0</strong></div>
          <span className="caption muted">1 staff · 10 products</span>
        </div>
        <div className="card pad-sm stack-sm">
          {bar("Staff", 1, 1)}
          {bar("Products", n, 10)}
        </div>
        {notice(<><strong>Try Pro free for 7 days</strong><br />Up to 5 staff and unlimited products. No card needed. You can try it once.<br /><button type="button" className="text-btn" data-live="plans-unavailable">Start free trial</button></>, "info")}
        <div className="form-actions"><button className="primary" type="button" data-live="plans-unavailable">See plans</button></div>
      </div>,
      { back: "business-settings", cls: "narrow" },
    );
  }
  function wallet() {
    const dash = "\u2014";
    return ownerOnly(
      "Wallet",
      <>
        <div className="wallet-grid">
          <div className="card pad stack-sm wallet-card">
            <span className="caption muted">Available balance</span>
            <strong className="money-lg">{dash}</strong>
            <span className="caption muted">Ready to withdraw now</span>
            <div className="kv-row"><span>Total received (all time)</span><strong>{dash}</strong></div>
            <button className="primary" type="button" data-live="withdraw-open">Withdraw</button>
          </div>
          <section className="stack-sm">
            <p className="step-label">TRANSACTIONS</p>
            <div className="chip-row">
              {["All", "Customer payments", "Withdrawals"].map((t, i) => (
                <span key={t} className={"chip" + (i === 0 ? " selected" : "")}>{i === 0 ? "\u2713 " : ""}{t}</span>
              ))}
            </div>
            {empty("No transactions yet", "Customer payments and withdrawals will show here.")}
          </section>
        </div>
        <p className="sim-tag">{ico("info")} Simulated · test mode, no real money moves</p>
        {state.withdrawOpen && (
          <div className="modal-backdrop">
            {state.withdrawReview ? (
              <div className="modal card">
                <div className="modal-head">
                  <h2>Review withdrawal</h2>
                  <button type="button" className="icon-btn" data-live="withdraw-close" aria-label="Close">{"\u2715"}</button>
                </div>
                <div className="card">
                  <div className="kv"><span>Withdrawal amount</span><strong>{formatMinor(state.withdrawReview)}</strong></div>
                  <div className="kv"><span>Withdrawal fee</span><strong>{dash}</strong></div>
                  <div className="kv"><span>To</span><strong>No withdrawal account yet</strong></div>
                </div>
                <p className="caption muted">The withdrawal fee is set by our payment provider and taken from the withdrawal amount.</p>
                {notice("You can cancel while it’s Pending. Once it’s Processing, it can’t be stopped.", "info")}
                <p className="sim-tag">{ico("info")} Simulated · test mode, no real money moves</p>
                <p className="form-error" id="live-error" role="alert" />
                <div className="form-actions">
                  <button type="button" className="secondary" data-live="withdraw-change">Change amount</button>
                  <button type="button" className="primary" data-live="withdraw-confirm">Confirm withdrawal</button>
                </div>
              </div>
            ) : (
            <form id="live-withdraw" className="modal card" noValidate>
              <div className="modal-head">
                <div><h2>Withdraw</h2><p className="caption muted">Money goes to your withdrawal account.</p></div>
                <button type="button" className="icon-btn" data-live="withdraw-close" aria-label="Close">{"\u2715"}</button>
              </div>
              <label className="field amount-field"><span>Amount to withdraw</span>
                <input name="amount" type="text" inputMode="decimal" placeholder={"\u20A60"} autoComplete="off" required />
              </label>
              <p className="caption muted">You can withdraw up to {dash}</p>
              <div className="card">
                <div className="kv"><span>Available balance</span><strong>{dash}</strong></div>
                <div className="kv"><span>To</span><a href="#/withdrawal-account"><strong>Add a withdrawal account</strong></a></div>
              </div>
              <p className="form-error" id="live-error" role="alert" />
              <div className="form-actions">
                <button type="button" className="secondary" data-live="withdraw-close">Cancel</button>
                <button type="submit" className="primary">Continue</button>
              </div>
            </form>
            )}
          </div>
        )}
      </>,
      { back: "home", subtitle: "Invent IO collection account" },
    );
  }
  function connectPaystack() {
    const step = state.psStep || 1;
    const biz = state.tenant?.businessName || api.session?.businessName || "your business";
    return <AuthFrame title="Connect Paystack" back="business-settings">
      <h1 className="auth-title desktop-only">Connect Paystack</h1>
      {step === 1 && <>
        <p className="step-label">1 OF 3 · SECRET KEY</p>
        <p className="status-text">In your Paystack dashboard, go to Settings › API Keys & Webhooks and copy your live secret key.</p>
        <form id="live-connect-paystack" className="stack" noValidate>
          {field("secretKey", "Secret key", "", "password", "Starts with sk_live_", 'required autocomplete="off" placeholder="sk_live_…"')}
          <Callout tone="info" title="Keep this key private">It’s stored encrypted. After you save it, Invent IO only shows the last 3 characters. Only you, the owner, can change it.</Callout>
          <p className="form-error" id="live-error" role="alert" />
          <div className="auth-bottom">
            <button className="primary" type="submit">Check key</button>
            {link("Do this later", "business-settings")}
          </div>
        </form>
      </>}
      {step === 2 && <>
        <p className="step-label">2 OF 3 · WEBHOOK</p>
        <p className="status-text">Add this link to Paystack so your payments show up in Invent IO.</p>
        <div className="stack">
          <label className="field">Your webhook URL
            <input type="text" readOnly disabled placeholder="Your webhook link will appear here" />
          </label>
          <p className="caption muted">Unique to {biz}. Don’t share it.</p>
          <button className="secondary" type="button" data-live="invite-unavailable">Copy link</button>
          <div className="stack-sm">
            <strong className="caption">In Paystack</strong>
            <ol className="steps-list"><li>Open Settings › API Keys & Webhooks</li><li>Paste the link into Live Webhook URL</li><li>Click Save changes</li></ol>
          </div>
          <button className="primary" type="button" data-live="ps-next">I’ve added it</button>
        </div>
      </>}
      {step === 3 && <>
        <p className="step-label">3 OF 3 · DONE</p>
        <Callout tone="success" title="Paystack connected">Card and transfer payments to your Paystack account will show in Pending payments, ready to match to a sale.</Callout>
        <div className="card">
          <div className="kv"><span>Secret key</span><strong>•••• {state.psKey || "•••"}</strong></div>
          <div className="kv"><span>Webhook</span><strong>Waiting for first payment</strong></div>
        </div>
        <p className="caption muted">We’ll mark the webhook as working when your first Paystack payment arrives. Paystack pays out to your bank as usual.</p>
        <button className="primary" type="button" data-live="ps-done">Continue</button>
      </>}
    </AuthFrame>;
  }
  function withdrawalAccount() {
    return ownerOnly(
      "Withdrawal account",
      <form id="live-withdrawal-account" className="card pad stack" noValidate>
        {field("bank", "Bank", "", "text", "", 'required placeholder="GTBank"')}
        {field("accountNumber", "Account number", "", "text", "10 digits", 'required inputmode="numeric" maxlength="10"')}
        <label className="field">Account name
          <input type="text" readOnly disabled placeholder="Found with your bank" />
        </label>
        <p className="caption muted">We check the account name with your bank before saving. Withdrawals will go to this account.</p>
        <p className="form-error" id="live-error" role="alert" />
        <button className="primary save-btn" type="submit">Save account</button>
      </form>,
      { back: "business-settings", cls: "narrow" },
    );
  }

  function businessSettings() {
    const biz = state.tenant?.businessName || api.session?.businessName || "";
    return ownerOnly(
      "Business settings",
      <form id="live-business-settings" className="card pad stack" noValidate>
        {field("businessName", "Business name", biz, "text", "", "required")}
        {field("whatsapp", "WhatsApp number", state.setup?.whatsapp || "", "tel", "", 'placeholder="0803 123 4567"')}
        {field("summaryEmail", "Email for weekly summary", state.setup?.summaryEmail || person().email || "", "email", "")}
        <p className="step-label">INTEGRATIONS</p>
        <div className="card">
          <div className="kv"><span>WhatsApp summary</span><strong>Sandbox</strong></div>
          <div className="kv"><span>Paystack · set up by Invent IO</span><strong>Sandbox</strong></div>
        </div>
        <p className="step-label">PAYMENTS</p>
        <a className="list-link card" href="#/connect-paystack">
          <div className="grow"><strong>Connect Paystack</strong><p>Use your own Paystack account</p></div>
          {ico("caret")}
        </a>
        <a className="list-link card" href="#/onboarding">
          <div className="grow"><strong>Payment setup</strong><p>Choose how customers pay you</p></div>
          {ico("caret")}
        </a>
        <a className="list-link card" href="#/admin">
          <div className="grow"><strong>Account overview</strong><p>Your account and payment details</p></div>
          {ico("caret")}
        </a>
        <p className="step-label">WITHDRAWALS</p>
        <a className="list-link card" href="#/withdrawal-account">
          <div className="grow"><strong>Withdrawal account</strong><p>Not set up yet</p></div>
          {ico("caret")}
        </a>
        <p className="caption muted">
          Only you can see or change this. Shown only for businesses using Invent IO payment collection.
        </p>
        <p className="step-label">SUBSCRIPTION</p>
        <a className="list-link card" href="#/subscription">
          <div className="grow"><strong>Subscription</strong><p>Free plan · 1 staff, 10 products</p></div>
          {ico("caret")}
        </a>
        <p className="form-error" id="live-error" role="alert" />
        <button className="primary save-btn" type="submit">Save changes</button>
      </form>,
      { cls: "narrow" },
    );
  }

  return {
    weeklySummary,
    subscription,
    wallet,
    connectPaystack,
    withdrawalAccount,
    inviteStaff,
    setupPayments,
    team,
    businessSettings,
    setupBusiness,
    setupProducts,
    setupDone,
    moreScreen,
    notificationSettings,
    shell,
    auth,
    home,
    products,
    importScreen,
    editor,
    onboarding,
    managedForm,
    direct,
    changePassword,
    checkEmail: () => <CheckEmail api={api} />,
    verifyPending: () => <VerifyPending api={api} />,
    verifyEmailScreen: (
      params = new URLSearchParams(location.hash.split("?")[1]),
    ) => <VerifyResult token={params.get("token")} verify={verify} api={api} />,
    account,
    admin,
    salesScreen,
    saleDetail,
    recordPayment,
    matchScreen,
  };
}
