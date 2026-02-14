/**
 * Stripe Checkout API – Lean MVP.
 * createCheckoutSession creates a Stripe Checkout Session and returns the payment URL.
 */

const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string | undefined;
const adminToken = import.meta.env.VITE_INBOX_ADMIN_TOKEN as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function ensureEnv(): { functionsUrl: string; adminToken: string; anonKey: string } {
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
  if (!supabaseAnonKey?.trim()) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY is missing. Add it to .env and restart Vite.'
    );
  }
  return {
    functionsUrl: functionsUrl.replace(/\/$/, ''),
    adminToken: adminToken.trim(),
    anonKey: supabaseAnonKey.trim(),
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
  const { functionsUrl, adminToken, anonKey } = ensureEnv();

  const res = await fetch(`${functionsUrl}/stripe-create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
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

// ---------------------------------------------------------------------------
// Stripe Invoicing API (new flow — embedded Payment Element)
// ---------------------------------------------------------------------------

export interface CreateStripeInvoiceResponse {
  stripe_invoice_id: string;
  /** Present when invoice is open/unpaid for embedded Payment Element */
  client_secret?: string;
  payment_intent_id?: string;
  /** Hosted invoice page URL (Stripe Invoicing). Used by table "Link" button. */
  hosted_invoice_url: string | null;
  invoice_pdf?: string | null;
  stripe_invoice_status?: string;
}

/**
 * Create (or retrieve existing) Stripe Invoice for the given Mason invoice.
 * Returns the PaymentIntent client_secret for use with Stripe Elements.
 */
export async function createStripeInvoice(
  invoiceId: string
): Promise<CreateStripeInvoiceResponse> {
  const { functionsUrl, adminToken, anonKey } = ensureEnv();

  const res = await fetch(`${functionsUrl}/stripe-create-invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
      'X-Admin-Token': adminToken,
    },
    body: JSON.stringify({ invoice_id: invoiceId }),
  });

  if (!res.ok) {
    const body = await res.text();
    let message = `Stripe Invoice creation failed (${res.status})`;
    try {
      const j = JSON.parse(body) as { error?: string };
      if (j?.error) message = j.error;
    } catch {
      if (body) message = body;
    }
    throw new Error(message);
  }

  const data = (await res.json()) as CreateStripeInvoiceResponse;
  if (!data?.stripe_invoice_id || typeof data.stripe_invoice_id !== 'string') {
    throw new Error('Invalid response: missing stripe_invoice_id');
  }
  return data;
}
