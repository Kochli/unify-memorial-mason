-- AI suggested reply cache: one suggestion per inbound message.
-- Inserts only via Edge Function (service role). Authenticated users can SELECT
-- only rows for messages they can read (tenant-scoped when inbox_messages has RLS).

create table if not exists public.inbox_ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.inbox_messages(id) on delete cascade,
  suggestion_text text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_inbox_ai_suggestions_message_id
  on public.inbox_ai_suggestions (message_id);

comment on table public.inbox_ai_suggestions is 'Cached AI reply suggestions per inbound message; populated by Edge Function only.';

alter table public.inbox_ai_suggestions enable row level security;

-- SELECT: authenticated users may read suggestions for messages they can read.
-- (When inbox_messages has RLS, the subquery is subject to it → tenant-scoped.)
create policy "Allow authenticated read for related message"
  on public.inbox_ai_suggestions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.inbox_messages m
      where m.id = inbox_ai_suggestions.message_id
    )
  );

-- No INSERT/UPDATE/DELETE for authenticated; only service role (Edge Function) may insert.
