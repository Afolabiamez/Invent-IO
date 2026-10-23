import { test } from "node:test";
import assert from "node:assert/strict";
import { initialData, profit } from "../public/data.js";
import { recordSale, voidSale, cancelWithdrawal } from "../public/model.js";
test("sale records stock atomically, permits negative inventory, and cannot be submitted twice", () => {
  const d = initialData();
  recordSale(d, "p3", { shea: 2, soap: 2 }, "Amaka");
  assert.equal(d.products.find((p) => p.id === "shea").stock, 15);
  assert.equal(d.products.find((p) => p.id === "soap").stock, -3);
  assert.equal(profit(d.payments.find((p) => p.id === "p3")), 1600);
  assert.throws(() => recordSale(d, "p3", { shea: 2, soap: 2 }, "Amaka"));
  assert.equal(d.products.find((p) => p.id === "shea").stock, 15);
});
test("a changed or archived selection leaves payment and every stock count unchanged", () => {
  const d = initialData();
  d.products.find((p) => p.id === "soap").archived = true;
  const before = structuredClone(d);
  assert.throws(() => recordSale(d, "p3", { shea: 2, soap: 2 }, "Amaka"));
  assert.deepEqual(d, before);
});
test("mismatched payment cannot partially reduce inventory", () => {
  const d = initialData(),
    before = structuredClone(d);
  assert.throws(() => recordSale(d, "p3", { shea: 1 }, "Amaka"));
  assert.deepEqual(d, before);
});
test("void returns stock exactly once and preserves sale price/cost snapshots", () => {
  const d = initialData();
  recordSale(d, "p3", { shea: 2, soap: 2 }, "Amaka");
  d.products[0].price = 9000;
  assert.equal(profit(d.payments.find((p) => p.id === "p3")), 1600);
  assert.equal(voidSale(d, "p3"), true);
  assert.equal(voidSale(d, "p3"), false);
  assert.equal(d.products[0].stock, 17);
  assert.equal(d.products.find((p) => p.id === "soap").stock, -1);
});
test("missing cost is unavailable; a zero cost is valid", () => {
  assert.equal(
    profit({ items: [{ price: 2500, cost: null, quantity: 1 }] }),
    null,
  );
  assert.equal(
    profit({ items: [{ price: 2500, cost: 0, quantity: 1 }] }),
    2500,
  );
});
test("cancellation refunds a pending withdrawal once and cannot stop processing", () => {
  const d = initialData();
  assert.equal(cancelWithdrawal(d, "t2"), true);
  assert.equal(d.balance, 136400);
  assert.equal(cancelWithdrawal(d, "t2"), false);
  assert.equal(d.balance, 136400);
  d.transactions[1].status = "Processing";
  assert.equal(cancelWithdrawal(d, "t2"), false);
});
