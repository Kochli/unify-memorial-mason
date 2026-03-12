function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Format a decimal currency value as GBP.
 * Use for values stored as pounds (e.g. 1234.56).
 */
export function formatGbpDecimal(value: number | string | null | undefined): string {
  if (value == null) return '—';
  const n = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  if (!Number.isFinite(n)) return '—';
  return `£${n.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format an integer pence amount as GBP.
 * Use for values stored as pence (e.g. 1234 => £12.34).
 */
export function formatGbpPence(pence: number | null | undefined): string {
  if (pence == null) return '—';
  const n = Number(pence);
  if (!Number.isFinite(n)) return '—';
  return `£${(n / 100).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a date as DD-MM-YYYY.
 * Handles Date objects and ISO-like strings. Returns em dash placeholder on invalid/missing.
 */
export function formatDateDMY(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = String(d.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Format a date (and optional time) with the date portion standardized to DD-MM-YYYY.
 * Defaults: withTime=true, 24-hour clock, minutes precision.
 */
export function formatDateTimeDMY(
  value: string | Date | null | undefined,
  opts?: { withTime?: boolean; withSeconds?: boolean; use12Hour?: boolean }
): string {
  const d = toDate(value);
  if (!d) return '—';

  const datePart = formatDateDMY(d);
  const withTime = opts?.withTime ?? true;
  if (!withTime) return datePart;

  const minutes = pad2(d.getMinutes());
  const seconds = pad2(d.getSeconds());
  const withSeconds = opts?.withSeconds ?? false;
  const use12Hour = opts?.use12Hour ?? false;

  if (use12Hour) {
    const rawHours = d.getHours();
    const ampm = rawHours >= 12 ? 'PM' : 'AM';
    const hh12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
    const hh = pad2(hh12);
    const time = withSeconds ? `${hh}:${minutes}:${seconds} ${ampm}` : `${hh}:${minutes} ${ampm}`;
    return `${datePart} ${time}`;
  }

  const hh24 = pad2(d.getHours());
  const time = withSeconds ? `${hh24}:${minutes}:${seconds}` : `${hh24}:${minutes}`;
  return `${datePart} ${time}`;
}

