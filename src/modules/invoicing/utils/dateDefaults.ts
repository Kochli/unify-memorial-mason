/**
 * Returns the default invoice due date: 3 days from the given date (or today if not provided).
 * Format: YYYY-MM-DD (ISO date string for input type="date" and DB consistency).
 */
export function getDefaultDueDate(fromDate?: Date): string {
  const base = fromDate ?? new Date();
  const d = new Date(base);
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
}
