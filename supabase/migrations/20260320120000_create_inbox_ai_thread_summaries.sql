-- persisted ai thread summaries: one row per conversation or per customer unified timeline (open conversations only, matching usePersonUnifiedTimeline)

create table if not exists public.inbox_ai_thread_summaries (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  conversation_id uuid references public.inbox_conversations(id) on delete cascade,
  person_id uuid references public.customers(id) on delete cascade,
  summary_text text not null,
  messages_fingerprint text not null,
  updated_at timestamptz not null default now(),
  constraint inbox_ai_thread_summaries_scope_check check (
    (
      scope = 'conversation'
      and conversation_id is not null
      and person_id is null
    )
    or (
      scope = 'customer_timeline'
      and person_id is not null
      and conversation_id is null
    )
  ),
  constraint inbox_ai_thread_summaries_scope_allowed check (scope in ('conversation', 'customer_timeline'))
);

create unique index if not exists idx_inbox_ai_thread_summaries_conversation
  on public.inbox_ai_thread_summaries (conversation_id)
  where scope = 'conversation';

create unique index if not exists idx_inbox_ai_thread_summaries_person
  on public.inbox_ai_thread_summaries (person_id)
  where scope = 'customer_timeline';

comment on table public.inbox_ai_thread_summaries is 'cached ai summaries per inbox thread or per customer unified timeline; written only by edge function (service role).';

alter table public.inbox_ai_thread_summaries enable row level security;

create policy "authenticated can read own conversation thread summaries"
  on public.inbox_ai_thread_summaries
  for select
  to authenticated
  using (
    (
      scope = 'conversation'
      and exists (
        select 1
        from public.inbox_conversations c
        where c.id = inbox_ai_thread_summaries.conversation_id
          and c.user_id = (select auth.uid())
      )
    )
    or (
      scope = 'customer_timeline'
      and exists (
        select 1
        from public.inbox_conversations c
        where c.person_id = inbox_ai_thread_summaries.person_id
          and c.user_id = (select auth.uid())
          and c.status = 'open'
      )
    )
  );
