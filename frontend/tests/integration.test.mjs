import { test } from "node:test";
import assert from "node:assert/strict";
import { createApi, ApiError } from "../public/api.js";
import { prepareImport, parseCsv } from "../public/csv-import.js";
import { nairaToMinor, formatMinor } from "../public/money.js";
import { pushSupport, createPush } from "../public/notifications.js";
import { createFrontendServer } from "../scripts/serve.mjs";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
const store = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
test("CSV preserves quoted names, BOM, newlines and SKU strings while converting naira exactly", () => {
  const batch = prepareImport(
    '\ufeffname,sku,price,cost\r\n"Body, cream",001,0.29,0.10\r\n"Two\nlines",002,2000,1000',
    "naira",
  );
  assert.equal(batch.preview[0].price, "29");
  assert.equal(batch.preview[0].sku, "001");
  assert.equal(parseCsv(batch.csv)[1][0], "Body, cream");
  assert.equal(batch.preview[1].name, "Two\nlines");
  assert.equal(batch.preview[1].price, "200000");
});
test("CSV validates money units, range, required columns and row shape before submitting", () => {
  assert.throws(
    () => prepareImport("name,price,cost\nSoap,1.123,1"),
    /row 1, price/i,
  );
  assert.throws(
    () => prepareImport("name,price,cost\nSoap,1.2,1", "kobo"),
    /whole kobo/,
  );
  assert.throws(
    () => prepareImport("name,price,cost\nSoap,999999999999999999,1", "kobo"),
    /range/,
  );
  assert.throws(() => prepareImport("name,price\nSoap,10"), /cost/);
  assert.throws(() => prepareImport("name,price,cost\nSoap,1"), /columns/);
  assert.throws(() => parseCsv('name\n"open'), /closing quote/);
  const b = prepareImport("name,price,cost,stock\nSoap,10,5,12");
  assert.equal(b.withoutSku, 1);
  assert.deepEqual(b.ignoredColumns, ["stock"]);
  assert.equal(nairaToMinor("0.29"), "29");
  assert.equal(formatMinor("900719925474099329"), "₦9,007,199,254,740,993.29");
});
test("concurrent 401 responses share one refresh and retain the rotated refresh token", async () => {
  let refreshes = 0;
  const storage = store();
  storage.setItem(
    "invent-api-session-v1",
    JSON.stringify({ accessToken: "old", refreshToken: "old-refresh" }),
  );
  const api = createApi({
    storage,
    fetcher: async (url, options) => {
      if (url.endsWith("/auth/refresh")) {
        refreshes++;
        await new Promise((r) => setTimeout(r, 5));
        return json({ accessToken: "new", refreshToken: "new-refresh" });
      }
      return options.headers.Authorization === "Bearer new"
        ? json({ ok: true })
        : json({ message: "Expired" }, 401);
    },
  });
  await Promise.all([
    api.request("/products"),
    api.request("/push/vapid-public-key"),
  ]);
  assert.equal(refreshes, 1);
  assert.equal(api.session.refreshToken, "new-refresh");
});
test("API exposes stable codes/request IDs, rejects malformed success, clears a failed refresh", async () => {
  const storage = store();
  const api = createApi({
    storage,
    fetcher: async () =>
      json(
        {
          error: {
            code: "ALREADY_MATCHED",
            message: "Already recorded",
            requestId: "support-123",
          },
        },
        409,
      ),
  });
  await assert.rejects(
    api.request("/payments/p/match"),
    (e) =>
      e instanceof ApiError &&
      e.code === "ALREADY_MATCHED" &&
      e.requestId === "support-123",
  );
  const bad = createApi({
    storage,
    fetcher: async () => new Response("<html>oops</html>"),
  });
  await assert.rejects(bad.request("/products"), /unexpected/);
  storage.setItem(
    "invent-api-session-v1",
    JSON.stringify({ accessToken: "old", refreshToken: "expired" }),
  );
  let expired = false;
  const failure = createApi({
    storage,
    onExpired: () => (expired = true),
    fetcher: async () => json({ message: "Invalid token" }, 401),
  });
  await assert.rejects(failure.request("/products"));
  assert.equal(failure.session, null);
  assert.equal(expired, true);
});
test("iPhone browser explains Add to Home Screen instead of requesting permission", () => {
  const env = {
    navigator: { userAgent: "iPhone", platform: "iPhone" },
    matchMedia: () => ({ matches: false }),
    isSecureContext: true,
  };
  assert.equal(pushSupport(env).supported, false);
  assert.match(pushSupport(env).message, /Home Screen/);
});
test("push registration sends only the endpoint and keys; failed API sync rolls back a new subscription", async () => {
  let unsubscribed = 0,
    posted;
  const subscription = {
    endpoint: "https://push.example/device",
    toJSON: () => ({
      endpoint: "https://push.example/device",
      expirationTime: null,
      keys: { p256dh: "public", auth: "secret" },
    }),
    unsubscribe: async () => {
      unsubscribed++;
    },
  };
  const reg = {
    pushManager: {
      getSubscription: async () => null,
      subscribe: async (options) => {
        assert.equal(options.userVisibleOnly, true);
        return subscription;
      },
    },
  };
  const env = {
    isSecureContext: true,
    navigator: {
      userAgent: "Android",
      serviceWorker: { register: async () => reg, ready: Promise.resolve(reg) },
    },
    PushManager: {},
    Notification: { requestPermission: async () => "granted" },
    matchMedia: () => ({ matches: false }),
  };
  const api = {
    request: async (path, options) => {
      if (path.endsWith("public-key")) return { publicKey: "AQID" };
      posted = options.body;
      throw new Error("Offline");
    },
  };
  const push = createPush({ api, env });
  await push.prepare();
  await assert.rejects(push.enable(), /Offline/);
  assert.deepEqual(posted, {
    endpoint: subscription.endpoint,
    keys: { p256dh: "public", auth: "secret" },
  });
  assert.equal(unsubscribed, 1);
});
test("service worker displays title/body and ignores externally supplied click URLs", async () => {
  const handlers = {},
    shown = [],
    opened = [];
  const self = {
    registration: {
      scope: "https://app.example/",
      showNotification: async (...args) => shown.push(args),
    },
    addEventListener: (name, fn) => (handlers[name] = fn),
    clients: {
      matchAll: async () => [],
      openWindow: async (url) => opened.push(url),
    },
  };
  vm.runInNewContext(
    await readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    { self, URL },
  );
  let pending;
  handlers.push({
    data: {
      json: () => ({
        title: "Payment received",
        body: "₦5,000 received",
        url: "https://evil.example/",
      }),
    },
    waitUntil: (p) => (pending = p),
  });
  await pending;
  assert.equal(shown[0][0], "Payment received");
  assert.equal(shown[0][1].body, "₦5,000 received");
  handlers.notificationclick({
    notification: { close() {}, data: { url: "https://evil.example/" } },
    waitUntil: (p) => (pending = p),
  });
  await pending;
  assert.equal(opened[0], "https://app.example/#/home");
});
test("fixed-origin proxy forwards auth/JSON, omits cookies, and serves a non-caching worker", async () => {
  let request;
  const server = createFrontendServer({
    fetcher: async (url, options) => {
      request = { url: String(url), ...options };
      return json({ publicKey: "test" });
    },
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = "http://127.0.0.1:" + server.address().port;
  try {
    const response = await fetch(origin + "/api/v1/push/subscriptions", {
      method: "POST",
      headers: {
        Authorization: "Bearer test",
        Cookie: "must-not-forward=1",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint: "test", keys: {} }),
    });
    assert.equal(response.status, 200);
    assert.equal(
      request.url,
      "https://invent-io-backend-production.up.railway.app/v1/push/subscriptions",
    );
    assert.equal(request.headers.authorization, "Bearer test");
    assert.equal(request.headers.cookie, undefined);
    assert.equal(request.redirect, "error");
    const worker = await fetch(origin + "/sw.js");
    assert.match(worker.headers.get("Content-Type"), /javascript/);
    assert.equal(worker.headers.get("Cache-Control"), "no-store");
  } finally {
    await new Promise((r) => server.close(r));
  }
});
