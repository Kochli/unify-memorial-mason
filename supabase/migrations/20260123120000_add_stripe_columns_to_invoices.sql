-- Add Stripe columns to invoices (additive-only)
-- Lean Stripe MVP: payment link, webhook-driven paid status

alter table public.invoices
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_status text default 'unpaid',
  add column if not exists paid_at timestamptz;

comment on column public.invoices.stripe_checkout_session_id is 'Stripe Checkout Session ID from session creation';
comment on column public.invoices.stripe_payment_intent_id is 'Stripe Payment Intent ID when payment completes';
comment on column public.invoices.stripe_status is 'Stripe lifecycle: unpaid | pending | paid';
comment on column public.invoices.paid_at is 'When Stripe payment completed (webhook)';
