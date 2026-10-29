export function nairaToMinor(value) {
  const match = String(value)
    .trim()
    .match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match)
    throw new Error("Enter a naira amount with up to two decimal places.");
  return (
    BigInt(match[1]) * 100n +
    BigInt((match[2] || "").padEnd(2, "0"))
  ).toString();
}
export function formatMinor(value) {
  const n = BigInt(value),
    absolute = n < 0n ? -n : n;
  return (
    (n < 0n ? "−" : "") +
    "₦" +
    (absolute / 100n).toLocaleString("en-NG") +
    (absolute % 100n ? "." + (absolute % 100n).toString().padStart(2, "0") : "")
  );
}
export function safeMinorNumber(value) {
  const n = BigInt(value);
  if (n < 0n || n > 2147483647n)
    throw new Error("Amount exceeds the catalog API’s supported range.");
  return Number(n);
}
