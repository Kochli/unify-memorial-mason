-- Add Stripe Invoicing API columns to invoices table.
-- These support the new flow where a real Stripe Invoice is created
-- (instead of a Checkout Session). Existing Checkout columns are kept
-- for backward compatibility.

alter table public.invoices
  add column if not exists stripe_invoice_id text,
  add column if not exists stripe_invoice_status text;

-- Partial index for fast webhook lookups by Stripe Invoice ID
create index if not exists idx_invoices_stripe_invoice_id
  on public.invoices (stripe_invoice_id)
  where stripe_invoice_id is not null;
