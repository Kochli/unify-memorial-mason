const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

export function normalizeEmail(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function isLikelyEmail(value: string | null | undefined): boolean {
  const v = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * Parse RFC5322-ish header values into a list of bare email addresses.
 * Handles:
 * - "John Doe <john@example.com>"
 * - "a@b.com, c@d.com"
 * - mixed whitespace/casing
 *
 * This intentionally uses a pragmatic regex approach suitable for inbox linking.
 */
export function parseEmailAddresses(raw: string | null | undefined): string[] {
  const input = (raw ?? '').trim();
  if (!input) return [];

  const matches = input.match(EMAIL_REGEX) ?? [];
  const normalized = matches.map((m) => normalizeEmail(m)).filter((m) => isLikelyEmail(m));

  // De-dupe while preserving order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of normalized) {
    if (seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }
  return out;
}

export type EmailDirection = 'inbound' | 'outbound';

/**
 * Deterministically choose a single "counterparty" email for the conversation.
 *
 * - inbound: first From address
 * - outbound: first To address that isn't the user's mailbox; fallback to first To
 *
 * Returns null when no valid email is available.
 */
export function pickPrimaryHandleEmail(params: {
  direction: EmailDirection;
  fromEmails: string[];
  toEmails: string[];
  userEmail: string;
}): string | null {
  const user = normalizeEmail(params.userEmail);

  if (params.direction === 'inbound') {
    const from = params.fromEmails[0] ?? null;
    return from && isLikelyEmail(from) ? from : null;
  }

  const nonUserTo = params.toEmails.filter((e) => normalizeEmail(e) !== user);
  const chosen = (nonUserTo[0] ?? params.toEmails[0] ?? null) as string | null;
  return chosen && isLikelyEmail(chosen) ? normalizeEmail(chosen) : null;
}

/**
 * Choose a safe email for auto-linking. This is stricter than primary_handle selection:
 * we only link when the counterparty email is unambiguous.
 *
 * - inbound: requires exactly one From address
 * - outbound: requires exactly one non-user recipient, or exactly one To recipient
 */
export function pickEmailForAutoLink(params: {
  direction: EmailDirection;
  fromEmails: string[];
  toEmails: string[];
  userEmail: string;
}): string | null {
  const user = normalizeEmail(params.userEmail);

  if (params.direction === 'inbound') {
    if (params.fromEmails.length !== 1) return null;
    const from = params.fromEmails[0] ?? null;
    return from && isLikelyEmail(from) ? normalizeEmail(from) : null;
  }

  const nonUserTo = params.toEmails.filter((e) => normalizeEmail(e) !== user);
  if (nonUserTo.length === 1) return normalizeEmail(nonUserTo[0]);
  if (nonUserTo.length === 0 && params.toEmails.length === 1) return normalizeEmail(params.toEmails[0]);

  // Multi-recipient outbound email: ambiguous counterparty for linking.
  return null;
}

