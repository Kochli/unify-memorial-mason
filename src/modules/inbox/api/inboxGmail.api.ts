interface SyncGmailOptions {
  since?: string; // ISO timestamp
  maxMessages?: number;
}

interface SyncGmailResult {
  syncedCount: number;
  skippedCount: number;
  errorsCount: number;
}

interface SendGmailReplyResult {
  success: true;
  gmailMessageId: string;
  gmailThreadId: string;
}

/**
 * Sync Gmail emails into inbox_conversations and inbox_messages
 */
export async function syncGmail(
  options?: SyncGmailOptions
): Promise<SyncGmailResult> {
  const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
  const adminToken = import.meta.env.VITE_INBOX_ADMIN_TOKEN;

  if (!functionsUrl || !adminToken) {
    throw new Error(
      'Gmail sync requires VITE_SUPABASE_FUNCTIONS_URL and VITE_INBOX_ADMIN_TOKEN environment variables'
    );
  }

  const response = await fetch(`${functionsUrl}/inbox-gmail-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': adminToken,
    },
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Gmail sync failed: ${response.statusText}`);
  }

  return await response.json() as SyncGmailResult;
}

/**
 * Send a Gmail reply for an email conversation
 */
export async function sendGmailReply({
  conversationId,
  bodyText,
}: {
  conversationId: string;
  bodyText: string;
}): Promise<SendGmailReplyResult> {
  const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
  const adminToken = import.meta.env.VITE_INBOX_ADMIN_TOKEN;

  if (!functionsUrl || !adminToken) {
    throw new Error(
      'Gmail send requires VITE_SUPABASE_FUNCTIONS_URL and VITE_INBOX_ADMIN_TOKEN environment variables'
    );
  }

  const response = await fetch(`${functionsUrl}/inbox-gmail-send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': adminToken,
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      body_text: bodyText,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Gmail send failed: ${response.statusText}`);
  }

  return await response.json() as SendGmailReplyResult;
}
