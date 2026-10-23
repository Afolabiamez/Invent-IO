// Browser-only fixtures. API integration must replace this store; no credentials are saved.
export const permissionDefinitions = [
  [
    "record",
    "Record sales",
    "Record payments and match them to products",
    "Sales",
  ],
  [
    "inventory",
    "View inventory",
    "See products, selling prices and stock levels. Needed for the permissions below it",
    "Stock",
  ],
  ["stock", "Update stock", "Add received stock and correct counts", "Stock"],
  [
    "add",
    "Add products",
    "Create products, including during a sale",
    "Products & prices",
  ],
  [
    "edit",
    "Edit products",
    "Rename, change the photo and archive products",
    "Products & prices",
  ],
  [
    "price",
    "Change selling price",
    "Edit what customers pay",
    "Products & prices",
  ],
  [
    "cost",
    "Change cost price",
    "See and edit cost prices. Profit stays owner-only",
    "Products & prices",
  ],
  [
    "alert",
    "Change low-stock alert",
    "Choose the stock level at which a product is marked Low",
    "Products & prices",
  ],
];
export function initialData() {
  return {
    business: {
      name: "Amaka Beauty",
      phone: "0803 123 4567",
      email: "amaka@mail.com",
      collection: true,
    },
    owner: { name: "Amaka Okafor", email: "amaka@mail.com" },
    staff: {
      name: "Bisi Ade",
      email: "bisi@mail.com",
      permissions: ["record", "inventory"],
    },
    bank: { bank: "GTBank", name: "Amaka Okafor", last4: "4821" },
    balance: 86400,
    totalReceived: 1240000,
    products: [
      {
        id: "shea",
        name: "Shea butter 250g",
        price: 2000,
        cost: 1400,
        stock: 17,
        alert: 5,
        image: "assets/sheaLarge.png",
      },
      {
        id: "oil",
        name: "Coconut oil 1L",
        price: 1200,
        cost: 900,
        stock: 2,
        alert: 5,
        image: "assets/oil.png",
      },
      {
        id: "gel",
        name: "Hair gel 200ml",
        price: 1800,
        cost: 1100,
        stock: 0,
        alert: 5,
      },
      {
        id: "soap",
        name: "Black soap",
        price: 500,
        cost: 300,
        stock: -1,
        alert: 5,
      },
      {
        id: "cream",
        name: "Body cream 150ml",
        price: 2500,
        cost: null,
        stock: 4,
        alert: 5,
        image: "assets/cream.png",
      },
      {
        id: "lotion",
        name: "Body lotion 400ml",
        price: 3500,
        cost: 2400,
        stock: 8,
        alert: 5,
        image: "assets/lotion.png",
      },
    ],
    payments: [
      {
        id: "p1",
        amount: 10000,
        method: "Transfer",
        provider: "Paystack",
        customer: "",
        by: "Amaka",
        age: "2 days ago",
        old: true,
        status: "pending",
        date: "2026-10-01",
      },
      {
        id: "p2",
        amount: 3000,
        method: "Cash",
        customer: "",
        by: "Bisi",
        age: "1 h ago",
        note: "Product not in the list · “Body cream”",
        status: "pending",
        date: "2026-10-03",
      },
      {
        id: "p3",
        amount: 5000,
        method: "Cash",
        customer: "Ada O.",
        by: "Amaka",
        age: "12 min ago",
        status: "pending",
        date: "2026-10-03",
      },
      {
        id: "p4",
        amount: 5000,
        method: "Cash",
        customer: "Ada O.",
        by: "Amaka",
        age: "Today 10:42",
        status: "recorded",
        date: "2026-10-03",
        items: [
          {
            id: "shea",
            name: "Shea butter 250g",
            quantity: 2,
            price: 2000,
            cost: 1400,
          },
          {
            id: "soap",
            name: "Black soap",
            quantity: 2,
            price: 500,
            cost: 300,
          },
        ],
      },
      {
        id: "p5",
        amount: 3500,
        method: "Transfer",
        customer: "",
        by: "Amaka",
        age: "Today 10:15",
        status: "recorded",
        date: "2026-10-03",
        items: [
          {
            id: "lotion",
            name: "Body lotion 400ml",
            quantity: 1,
            price: 3500,
            cost: 2400,
          },
        ],
      },
      {
        id: "p6",
        amount: 2000,
        method: "Cash",
        customer: "",
        by: "Bisi",
        age: "Today 09:50",
        status: "voided",
        date: "2026-10-03",
        items: [
          {
            id: "shea",
            name: "Shea butter 250g",
            quantity: 1,
            price: 2000,
            cost: 1400,
          },
        ],
      },
      {
        id: "p7",
        amount: 7000,
        method: "Transfer",
        customer: "",
        by: "Amaka",
        age: "Today 09:12",
        status: "recorded",
        date: "2026-10-03",
        items: [
          {
            id: "lotion",
            name: "Body lotion 400ml",
            quantity: 2,
            price: 3500,
            cost: 2400,
          },
        ],
      },
      {
        id: "p8",
        amount: 20000,
        method: "Transfer",
        customer: "Tunde A.",
        by: "Amaka",
        age: "Yesterday 16:05",
        status: "excluded",
        date: "2026-10-02",
      },
      {
        id: "p9",
        amount: 1500,
        method: "Cash",
        customer: "",
        by: "Bisi",
        age: "Mon 28 Sep",
        status: "excluded",
        date: "2026-09-28",
      },
    ],
    transactions: [
      {
        id: "t1",
        type: "payment",
        amount: 2500,
        customer: "Tunde A.",
        method: "Transfer",
        age: "Today 10:42",
        status: "Received",
      },
      {
        id: "t2",
        type: "withdrawal",
        amount: 50000,
        age: "Today 09:30",
        status: "Pending",
        bank: "GTBank",
        last4: "4821",
      },
      {
        id: "t3",
        type: "withdrawal",
        amount: 50000,
        age: "Yesterday 16:05",
        status: "Successful",
        bank: "GTBank",
        last4: "4821",
      },
      {
        id: "t4",
        type: "payment",
        amount: 5000,
        customer: "Ada O.",
        method: "Card",
        age: "Yesterday 09:15",
        status: "Received",
      },
      {
        id: "t5",
        type: "withdrawal",
        amount: 50000,
        age: "Yesterday 08:00",
        status: "Failed, funds returned",
        bank: "GTBank",
        last4: "4821",
      },
      {
        id: "t6",
        type: "withdrawal",
        amount: 50000,
        age: "Yesterday 07:40",
        status: "Cancelled",
        bank: "GTBank",
        last4: "4821",
      },
    ],
    earlier: { amount: 33000, count: 11, profit: 7400, missing: 1 },
    invite: null,
    version: 2,
  };
}
const KEY = "invent-io-design-demo-v2";
export function readData() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    if (value?.version === 2) return value;
  } catch {}
  return initialData();
}
export function saveData(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export const money = (n) =>
  "₦" + Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 });
export const profit = (p) =>
  p.items?.some((i) => i.cost == null)
    ? null
    : (p.items || []).reduce((s, i) => s + (i.price - i.cost) * i.quantity, 0);
export const stockStatus = (p) =>
  p.stock < 0
    ? ["Check count · " + p.stock, "warn"]
    : p.stock === 0
      ? ["Out of stock", "bad"]
      : p.stock <= p.alert
        ? ["Low · " + p.stock + " left", "warn"]
        : [p.stock + " in stock", ""];
