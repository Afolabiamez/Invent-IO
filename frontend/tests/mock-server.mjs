// UI fixture server: all API requests are intercepted locally; no provider/network calls.
import { createFrontendServer } from "../scripts/serve.mjs";
import { prepareImport } from "../public/csv-import.js";
let products = [
    {
      id: "product-1",
      name: "Shea butter 250g",
      sku: "SHEA-250",
      price: 200000,
      cost: 140000,
      active: true,
    },
  ],
  managed = null,
  payments = [
    {
      id: "payment-1",
      amountMinor: "500000",
      reference: "MOCK-ONLY-001",
      channel: "cash",
    },
  ];
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const fetcher = async (url, options) => {
  const path = new URL(url).pathname;
  const body = options.body?.length ? JSON.parse(String(options.body)) : {};
  if (path === "/v1/auth/login" || path === "/v1/auth/register")
    return json({
      accessToken: "fixture-access-not-real",
      refreshToken: "fixture-refresh-not-real",
      userId: "fixture-user",
      organizationId: "fixture-org",
    });
  if (path === "/v1/auth/logout") return json({ message: "Logged out" });
  if (path === "/v1/tenancy/me")
    return json({
      organizationId: "fixture-org",
      userId: "fixture-user",
      permissions: ["*"],
      branchId: "fixture-branch",
    });
  if (path === "/v1/products" && options.method === "GET")
    return json({ items: products, nextCursor: null });
  if (path === "/v1/products" && options.method === "POST") {
    products.push({
      id: "product-" + (products.length + 1),
      ...body,
      active: true,
    });
    return json(products.at(-1));
  }
  if (path === "/v1/products/import") {
    const batch = prepareImport(body.csv, "kobo");
    products.push(
      ...batch.preview
        .slice(0, -1)
        .map((p, i) => ({ ...p, id: "import-" + i, active: true })),
    );
    return json({
      total: batch.preview.length,
      created: batch.preview.length - 1,
      updated: 0,
      skipped: 1,
      errors: [
        {
          row: batch.preview.length,
          message: "SKU already assigned to another product",
        },
      ],
    });
  }
  if (path === "/v1/push/vapid-public-key")
    return json({ publicKey: "B" + "A".repeat(86) });
  if (path === "/v1/push/subscriptions") return json({ ok: true });
  if (path === "/v1/payments/managed-account") {
    if (options.method === "POST")
      managed = {
        id: "fixture-managed",
        status: "ACTIVE",
        virtualAccounts: [
          {
            bankName: "Test bank (fixture)",
            accountName: "Mock merchant",
            accountNumber: "0000000000",
            status: "PENDING",
          },
        ],
      };
    return json(managed);
  }
  if (path === "/v1/payments")
    return json({ items: payments, nextCursor: null });
  if (path.endsWith("/match")) {
    payments = [];
    return json({
      id: "mock-sale",
      total: "400000",
      margin: "120000",
      variance: "100000",
      flagged: true,
    });
  }
  if (path === "/v1/dashboard/summary")
    return json({ revenue: "4850000", margin: "1230000", salesCount: 14 });
  if (path === "/v1/reports/sales")
    return json({ items: [], nextCursor: null });
  return json({ message: "Not implemented by UI fixture" }, 404);
};
createFrontendServer({ fetcher }).listen(4181, "127.0.0.1", () =>
  console.log("Mock UI only: http://localhost:4181"),
);
