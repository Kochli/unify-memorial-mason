-- Add person_id field to orders table
alter table public.orders
  add column person_id uuid null
  references public.customers(id) on delete set null;

-- Add person_name snapshot field
alter table public.orders
  add column person_name text null;

-- Add index for performance
create index if not exists idx_orders_person_id on public.orders(person_id);

-- Add column comments for clarity
comment on column public.orders.person_id is 'Foreign key to customers/people table. The actual customer/person who placed the order.';
comment on column public.orders.person_name is 'Snapshot of person name at time of order creation for resilience.';
comment on column public.orders.customer_name is 'Deceased name (legacy field name, but used for deceased person in UI).';

