export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (!isFinite(num)) {
    return "$0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (!isFinite(num)) {
    return "0";
  }
  return new Intl.NumberFormat("en-US").format(num);
}
