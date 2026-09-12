const euro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(value: number | string | null | undefined): string {
  const numeric = typeof value === "string" ? Number(value) : (value ?? 0);
  return euro.format(Number.isFinite(numeric) ? numeric : 0);
}

export function discountPercentage(regular: number, sale: number | null): number | null {
  if (!sale || sale >= regular || regular <= 0) return null;
  return Math.round(((regular - sale) / regular) * 100);
}

export function effectivePrice(regular: number, sale: number | null): number {
  return sale && sale < regular ? sale : regular;
}
