import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import Stripe from 'npm:stripe@14.21.0';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, stripe-signature',
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!webhookSecret || !stripeSecret) {
    console.error('STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY not set');
    return jsonResponse({ error: 'Webhook not configured' }, 500);
  }

  const signature = req.headers.get('stripe-signature') ?? req.headers.get('Stripe-Signature');
  if (!signature) {
    return jsonResponse({ error: 'Missing Stripe-Signature' }, 400);
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (e) {
    console.error('Failed to read webhook body', e);
    return jsonResponse({ error: 'Invalid body' }, 400);
  }

  const stripe = new Stripe(stripeSecret);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature';
    console.error('Stripe webhook signature verification failed:', msg);
    return jsonResponse({ error: 'Invalid signature' }, 400);
  }

  // --- Supabase client (shared across handlers) ---
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase URL or SERVICE_ROLE_KEY missing');
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // =========================================================
  // Event routing
  // =========================================================

  switch (event.type) {
    // ----- Legacy: Stripe Checkout flow -----
    case 'checkout.session.completed': {
      return await handleCheckoutSessionCompleted(event, stripe, supabase);
    }

    // ----- New: Stripe Invoicing API flow -----
    case 'invoice.paid': {
      return await handleInvoicePaid(event, supabase);
    }

    case 'invoice.payment_failed': {
      return await handleInvoicePaymentFailed(event, supabase);
    }

    default: {
      // Acknowledge unhandled event types
      return jsonResponse({ received: true });
    }
  }
});

// =========================================================
// Handler: checkout.session.completed (existing/legacy)
// =========================================================
async function handleCheckoutSessionCompleted(
  event: Stripe.Event,
  _stripe: Stripe,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const session = event.data.object as Stripe.Checkout.Session;
  let invoiceId: string | null = (session.metadata?.invoice_id as string) ?? null;
  const paymentIntent = session.payment_intent;
  if (
    !invoiceId &&
    paymentIntent &&
    typeof paymentIntent === 'object' &&
    paymentIntent.metadata?.invoice_id
  ) {
    invoiceId = paymentIntent.metadata.invoice_id as string;
  }
  if (!invoiceId) {
    console.error('checkout.session.completed: no invoice_id in metadata');
    return jsonResponse({ error: 'Missing invoice_id in session metadata' }, 400);
  }

  const { data: existing } = await supabase
    .from('invoices')
    .select('id, stripe_status')
    .eq('id', invoiceId)
    .single();

  if (!existing) {
    console.error('Webhook: invoice not found', invoiceId);
    return jsonResponse({ error: 'Invoice not found' }, 404);
  }

  // Idempotent: already paid
  if (existing.stripe_status === 'paid') {
    return jsonResponse({ received: true });
  }

  const paymentIntentId =
    typeof paymentIntent === 'string'
      ? paymentIntent
      : (paymentIntent?.id ?? null);

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    stripe_status: 'paid',
    paid_at: now,
    status: 'paid',
    updated_at: now,
    payment_date: now.slice(0, 10),
    payment_method: 'Stripe',
  };
  if (paymentIntentId) updates.stripe_payment_intent_id = paymentIntentId;
  if (session.id) updates.stripe_checkout_session_id = session.id;

  const { error: updateErr } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId);

  if (updateErr) {
    console.error('Failed to update invoice to paid', updateErr);
    return jsonResponse({ error: 'Failed to update invoice' }, 500);
  }

  return jsonResponse({ received: true });
}

// =========================================================
// Handler: invoice.paid (Stripe Invoicing API)
// =========================================================
async function handleInvoicePaid(
  event: Stripe.Event,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const stripeInvoice = event.data.object as Stripe.Invoice;
  const stripeInvoiceId = stripeInvoice.id;

  if (!stripeInvoiceId) {
    console.error('invoice.paid: missing invoice id');
    return jsonResponse({ error: 'Missing Stripe invoice id' }, 400);
  }

  // Look up Mason invoice by stripe_invoice_id
  const { data: existing } = await supabase
    .from('invoices')
    .select('id, status, stripe_invoice_status')
    .eq('stripe_invoice_id', stripeInvoiceId)
    .single();

  if (!existing) {
    // Could be an invoice not created by us — ignore
    console.warn('invoice.paid: no Mason invoice for Stripe invoice', stripeInvoiceId);
    return jsonResponse({ received: true });
  }

  // Idempotent: already paid
  if (existing.status === 'paid' && existing.stripe_invoice_status === 'paid') {
    return jsonResponse({ received: true });
  }

  const now = new Date().toISOString();
  const paymentIntentId =
    typeof stripeInvoice.payment_intent === 'string'
      ? stripeInvoice.payment_intent
      : (stripeInvoice.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

  const updates: Record<string, unknown> = {
    status: 'paid',
    stripe_status: 'paid',
    stripe_invoice_status: 'paid',
    paid_at: now,
    payment_date: now.slice(0, 10),
    payment_method: 'Stripe',
    updated_at: now,
  };
  if (paymentIntentId) updates.stripe_payment_intent_id = paymentIntentId;

  const { error: updateErr } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', existing.id);

  if (updateErr) {
    console.error('invoice.paid: failed to update Mason invoice', updateErr);
    return jsonResponse({ error: 'Failed to update invoice' }, 500);
  }

  return jsonResponse({ received: true });
}

// =========================================================
// Handler: invoice.payment_failed (Stripe Invoicing API)
// =========================================================
async function handleInvoicePaymentFailed(
  event: Stripe.Event,
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const stripeInvoice = event.data.object as Stripe.Invoice;
  const stripeInvoiceId = stripeInvoice.id;

  if (!stripeInvoiceId) {
    console.error('invoice.payment_failed: missing invoice id');
    return jsonResponse({ error: 'Missing Stripe invoice id' }, 400);
  }

  const { data: existing } = await supabase
    .from('invoices')
    .select('id, stripe_invoice_status')
    .eq('stripe_invoice_id', stripeInvoiceId)
    .single();

  if (!existing) {
    console.warn('invoice.payment_failed: no Mason invoice for Stripe invoice', stripeInvoiceId);
    return jsonResponse({ received: true });
  }

  // Only update stripe_invoice_status; do NOT change Mason status
  const { error: updateErr } = await supabase
    .from('invoices')
    .update({
      stripe_invoice_status: 'payment_failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (updateErr) {
    console.error('invoice.payment_failed: failed to update Mason invoice', updateErr);
    return jsonResponse({ error: 'Failed to update invoice' }, 500);
  }

  return jsonResponse({ received: true });
}
