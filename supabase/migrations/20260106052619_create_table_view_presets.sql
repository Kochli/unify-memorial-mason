-- Create table_view_presets table for storing shared column configuration presets
create table if not exists public.table_view_presets (
  id uuid primary key default gen_random_uuid(),
  module text not null,  -- 'orders' | 'invoices'
  name text not null,
  config jsonb not null,  -- stores column visibility/order/widths
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint unique_module_name unique (module, name)
);

-- Partial unique index to ensure only one default per module
create unique index if not exists idx_table_view_presets_one_default_per_module
  on public.table_view_presets (module)
  where is_default = true;

-- Index for querying presets by module
create index if not exists idx_table_view_presets_module on public.table_view_presets (module);

-- Enable RLS
alter table public.table_view_presets enable row level security;

-- RLS Policies (shared presets - all authenticated users can read/write)
create policy "Authenticated users can view presets"
  on public.table_view_presets
  for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create presets"
  on public.table_view_presets
  for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update presets"
  on public.table_view_presets
  for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete presets"
  on public.table_view_presets
  for delete
  using (auth.role() = 'authenticated');

-- Updated_at trigger
create trigger update_table_view_presets_updated_at
  before update on public.table_view_presets
  for each row
  execute function public.update_updated_at_column();

