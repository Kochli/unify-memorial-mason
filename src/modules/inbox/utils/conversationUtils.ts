/**
 * Compute preview text from message body (first 120 chars, trimmed)
 * Used for updating conversation.last_message_preview
 */
import { formatDateTimeDMY } from '@/shared/lib/formatters';

export function computeMessagePreview(bodyText: string): string {
  return bodyText.trim().substring(0, 120);
}

/**
 * Format timestamp for display (gracefully handle null)
 * Returns "No messages" if timestamp is null/undefined
 */
export function formatConversationTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) return "No messages";

  // Standardize to absolute date-time for consistency across app.
  // (Avoid locale-dependent toLocaleDateString and relative-time outputs.)
  const out = formatDateTimeDMY(timestamp, { withTime: true, withSeconds: false, use12Hour: false });
  return out === '—' ? 'Invalid date' : out;
}

/**
 * Format message sent_at timestamp (gracefully handle null)
 */
export function formatMessageTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) return "Time unknown";

  const out = formatDateTimeDMY(timestamp, { withTime: true, withSeconds: false, use12Hour: false });
  return out === '—' ? 'Invalid date' : out;
}
