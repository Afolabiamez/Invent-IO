// Local demo transitions only. Production must enforce these atomically on the server.
export function recordSale(data, id, quantities, actor) {
  const payment = data.payments.find((p) => p.id === id);
  if (!payment || payment.status !== "pending")
    throw new Error("This payment has already been recorded.");
  const items = Object.entries(quantities)
    .filter(([, q]) => q > 0)
    .map(([productId, quantity]) => {
      const p = data.products.find((x) => x.id === productId);
      if (!p || p.archived || !Number.isInteger(quantity) || quantity < 1)
        throw new Error("A selected product is no longer available.");
      return { ...p, quantity };
    });
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  if (!items.length || Math.abs(total - payment.amount) > 0.01)
    throw new Error("Choose products matching the payment.");
  payment.items = items.map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    cost: i.cost,
    quantity: i.quantity,
  }));
  payment.status = "recorded";
  payment.by = actor;
  payment.age = "Today 10:42";
  payment.date = "2026-10-03";
  for (const item of items) {
    const p = data.products.find((x) => x.id === item.id);
    p.stock -= item.quantity;
    p.updated = "Today 10:42 · by " + actor;
  }
  return { p: payment, items };
}
export function voidSale(data, id) {
  const p = data.payments.find((x) => x.id === id);
  if (!p || p.status !== "recorded") return false;
  p.status = "voided";
  for (const item of p.items || []) {
    const product = data.products.find((x) => x.id === item.id);
    if (product) product.stock += item.quantity;
  }
  return true;
}
export function cancelWithdrawal(data, id) {
  const t = data.transactions.find((x) => x.id === id);
  if (!t || !["Pending", "Waiting for funds"].includes(t.status)) return false;
  t.status = "Cancelled";
  data.balance += t.amount;
  return true;
}
