/** Prisma Decimal fields (price, subtotal, total, ...) arrive as strings over JSON; cart totals arrive as numbers. */
export function formatMoney(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return `$${n.toFixed(2)}`;
}
