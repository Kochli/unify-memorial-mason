-- Create permit_forms table and link from orders

create table if not exists public.permit_forms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  link text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for name search
create index if not exists idx_permit_forms_name on public.permit_forms (name);

-- Enable RLS
alter table public.permit_forms enable row level security;

-- RLS policies: internal module (authenticated CRUD)
create policy "Authenticated users can view permit forms"
  on public.permit_forms
  for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create permit forms"
  on public.permit_forms
  for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update permit forms"
  on public.permit_forms
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete permit forms"
  on public.permit_forms
  for delete
  using (auth.role() = 'authenticated');

-- updated_at trigger
create trigger update_permit_forms_updated_at
  before update on public.permit_forms
  for each row
  execute function public.update_updated_at_column();

-- Orders: optional permit form reference
alter table public.orders
  add column if not exists permit_form_id uuid references public.permit_forms(id) on delete set null;

create index if not exists idx_orders_permit_form_id on public.orders (permit_form_id);

