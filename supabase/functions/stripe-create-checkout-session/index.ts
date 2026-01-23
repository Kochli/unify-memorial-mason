import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import Stripe from 'npm:stripe@14.21.0';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, apikey, content-type, x-client-info, x-admin-token',
};

interface CreateCheckoutRequest {
  invoice_id: string;
}

interface OrderRow {
  id: string;
  order_type: string;
  value: number | null;
  renovation_service_cost: number | null;
  permit_cost: number | null;
  additional_options_total: number | null;
}

function getOrderTotal(order: OrderRow): number {
  const base = order.order_type === 'Renovation'
    ? (order.renovation_service_cost ?? 0)
    : (order.value ?? 0);
  const permit = order.permit_cost ?? 0;
  const options = order.additional_options_total ?? 0;
  return base + permit + options;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const adminToken = req.headers.get('x-admin-token') ?? req.headers.get('X-Admin-Token');
    const expectedToken = Deno.env.get('INBOX_ADMIN_TOKEN');
    if (!expectedToken || !adminToken || adminToken !== expectedToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body: CreateCheckoutRequest;
    try {
      body = (await req.json()) as CreateCheckoutRequest;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON or missing body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const invoiceId = body?.invoice_id;
    if (!invoiceId || typeof invoiceId !== 'string' || !invoiceId.trim()) {
      return new Response(
        JSON.stringify({ error: 'invoice_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const appOrigin = Deno.env.get('APP_ORIGIN');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Supabase URL or SERVICE_ROLE_KEY missing');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!stripeSecret || !appOrigin) {
      return new Response(
        JSON.stringify({ error: 'STRIPE_SECRET_KEY or APP_ORIGIN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const origin = appOrigin.replace(/\/$/, '');
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('id', invoiceId.trim())
      .single();

    if (invError || !invoice) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: orders, error: ordError } = await supabase
      .from('orders_with_options_total')
      .select('id, order_type, value, renovation_service_cost, permit_cost, additional_options_total')
      .eq('invoice_id', invoice.id);

    if (ordError) {
      console.error('Failed to load orders for invoice', ordError);
      return new Response(
        JSON.stringify({ error: 'Failed to load invoice orders' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const orderList = (orders ?? []) as OrderRow[];
    const totalPounds = orderList.reduce((sum, o) => sum + getOrderTotal(o), 0);
    const amountPence = Math.round(totalPounds * 100);
    if (amountPence <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invoice total must be greater than zero' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const stripe = new Stripe(stripeSecret);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'gbp',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: amountPence,
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { invoice_id: invoice.id },
      payment_intent_data: {
        metadata: { invoice_id: invoice.id },
      },
      success_url: `${origin}/dashboard/invoicing?invoice_id=${invoice.id}&stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/invoicing?invoice_id=${invoice.id}&stripe=cancel`,
    });

    if (!session.url) {
      return new Response(
        JSON.stringify({ error: 'Stripe did not return a checkout URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { error: updateErr } = await supabase
      .from('invoices')
      .update({
        stripe_checkout_session_id: session.id,
        stripe_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    if (updateErr) {
      console.error('Failed to update invoice with session id', updateErr);
      return new Response(
        JSON.stringify({ error: 'Failed to update invoice' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('stripe-create-checkout-session error', e);
    return new Response(
      JSON.stringify({ error: 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
