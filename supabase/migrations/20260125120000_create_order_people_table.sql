-- Create order_people join table for multiple people per order with one primary
-- Purpose: allow orders to link to multiple customers (people), with exactly one primary
-- Affected: new table public.order_people
-- Backward compatibility: orders.person_id and orders.person_name retained; mirror primary on save

-- order_people: many-to-many between orders and customers
create table if not exists public.order_people (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  person_id uuid not null references public.customers(id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique(order_id, person_id)
);

comment on table public.order_people is 'Links orders to people (customers); exactly one primary per order.';

-- At most one primary person per order
create unique index if not exists idx_order_people_one_primary_per_order
  on public.order_people (order_id) where is_primary = true;

-- Performance indexes
create index if not exists idx_order_people_order_id on public.order_people(order_id);
create index if not exists idx_order_people_person_id on public.order_people(person_id);

-- RLS
alter table public.order_people enable row level security;

create policy "order_people_select" on public.order_people
  for select to anon, authenticated using (true);

create policy "order_people_insert" on public.order_people
  for insert to anon, authenticated with check (true);

create policy "order_people_update" on public.order_people
  for update to anon, authenticated using (true) with check (true);

create policy "order_people_delete" on public.order_people
  for delete to anon, authenticated using (true);
