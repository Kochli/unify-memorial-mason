-- Create workers table
create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text null,
  role text not null check (role in ('installer', 'driver', 'stonecutter', 'other')),
  notes text null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS
alter table public.workers enable row level security;

-- Create RLS policy (allow all authenticated users)
create policy "Allow all access to workers" on public.workers
  for all using (true) with check (true);

-- Create updated_at trigger
create trigger update_workers_updated_at
  before update on public.workers
  for each row execute function public.update_updated_at_column();

-- Create indexes
create index if not exists idx_workers_is_active on public.workers(is_active);
create index if not exists idx_workers_role on public.workers(role);

-- Add table comment
comment on table public.workers is 'Internal workers/team members who can be assigned to jobs.';

