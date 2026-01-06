-- Create job_workers join table
create table if not exists public.job_workers (
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete restrict,
  created_at timestamp with time zone not null default now(),
  primary key (job_id, worker_id)
);

-- Enable RLS
alter table public.job_workers enable row level security;

-- Create RLS policy
create policy "Allow all access to job_workers" on public.job_workers
  for all using (true) with check (true);

-- Create indexes for query performance
create index if not exists idx_job_workers_job_id on public.job_workers(job_id);
create index if not exists idx_job_workers_worker_id on public.job_workers(worker_id);

-- Add table comment
comment on table public.job_workers is 'Many-to-many relationship between jobs and workers.';

