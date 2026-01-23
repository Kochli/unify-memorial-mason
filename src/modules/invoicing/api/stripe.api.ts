/**
 * Stripe Checkout API – Lean MVP.
 * createCheckoutSession creates a Stripe Checkout Session and returns the payment URL.
 */

const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined;
const adminToken = import.meta.env.VITE_INBOX_ADMIN_TOKEN as string | undefined;

function ensureEnv(): { functionsUrl: string; adminToken: string } {
  if (!functionsUrl?.trim()) {
    throw new Error(
      'VITE_SUPABASE_FUNCTIONS_URL is missing. Add it to .env and restart Vite.'
    );
  }
  if (!adminToken?.trim()) {
    throw new Error(
      'VITE_INBOX_ADMIN_TOKEN is missing. Add it to .env and restart Vite.'
    );
  }
  return {
    functionsUrl: functionsUrl.replace(/\/$/, ''),
    adminToken: adminToken.trim(),
  };
}

export interface CreateCheckoutSessionResponse {
  url: string;
}

/**
 * Create a Stripe Checkout Session for the given invoice.
 * Returns the checkout URL to share with the customer.
 * @throws If env vars missing or non-2xx response
 */
export async function createCheckoutSession(
  invoiceId: string
): Promise<CreateCheckoutSessionResponse> {
  const { functionsUrl, adminToken } = ensureEnv();

  const res = await fetch(`${functionsUrl}/stripe-create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': adminToken,
    },
    body: JSON.stringify({ invoice_id: invoiceId }),
  });

  if (!res.ok) {
    const body = await res.text();
    let message = `Stripe Checkout failed (${res.status})`;
    try {
      const j = JSON.parse(body) as { error?: string };
      if (j?.error) message = j.error;
    } catch {
      if (body) message = body;
    }
    throw new Error(message);
  }

  const data = (await res.json()) as CreateCheckoutSessionResponse;
  if (!data?.url || typeof data.url !== 'string') {
    throw new Error('Invalid response: missing url');
  }
  return data;
}
