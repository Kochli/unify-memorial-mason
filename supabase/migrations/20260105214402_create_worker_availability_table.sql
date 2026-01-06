-- Create worker_availability table
create table if not exists public.worker_availability (
  worker_id uuid primary key references public.workers(id) on delete cascade,
  mon_available boolean not null default true,
  tue_available boolean not null default true,
  wed_available boolean not null default true,
  thu_available boolean not null default true,
  fri_available boolean not null default true,
  sat_available boolean not null default false,
  sun_available boolean not null default false,
  start_time time null,
  end_time time null,
  notes text null,
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS
alter table public.worker_availability enable row level security;

-- Create RLS policy
create policy "Allow all access to worker_availability" on public.worker_availability
  for all using (true) with check (true);

-- Create updated_at trigger
create trigger update_worker_availability_updated_at
  before update on public.worker_availability
  for each row execute function public.update_updated_at_column();

-- Add table comment
comment on table public.worker_availability is 'Weekly availability template for workers. Informational only, not enforced.';

