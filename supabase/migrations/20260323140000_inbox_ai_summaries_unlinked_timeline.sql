-- Extend AI thread summaries for Customers tab unlinked handle timelines (per-user cache).

alter table public.inbox_ai_thread_summaries
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.inbox_ai_thread_summaries
  add column if not exists unlinked_channel text;

alter table public.inbox_ai_thread_summaries
  add column if not exists unlinked_handle text;

alter table public.inbox_ai_thread_summaries
  drop constraint if exists inbox_ai_thread_summaries_scope_check;

alter table public.inbox_ai_thread_summaries
  drop constraint if exists inbox_ai_thread_summaries_scope_allowed;

alter table public.inbox_ai_thread_summaries
  add constraint inbox_ai_thread_summaries_scope_allowed check (
    scope in ('conversation', 'customer_timeline', 'unlinked_timeline')
  );

alter table public.inbox_ai_thread_summaries
  add constraint inbox_ai_thread_summaries_scope_shape check (
    (
      scope = 'conversation'
      and conversation_id is not null
      and person_id is null
      and user_id is null
      and unlinked_channel is null
      and unlinked_handle is null
    )
    or (
      scope = 'customer_timeline'
      and person_id is not null
      and conversation_id is null
      and user_id is null
      and unlinked_channel is null
      and unlinked_handle is null
    )
    or (
      scope = 'unlinked_timeline'
      and user_id is not null
      and unlinked_channel is not null
      and unlinked_handle is not null
      and conversation_id is null
      and person_id is null
    )
  );

create unique index if not exists idx_inbox_ai_thread_summaries_unlinked_user
  on public.inbox_ai_thread_summaries (user_id, unlinked_channel, unlinked_handle)
  where scope = 'unlinked_timeline';

drop policy if exists "authenticated can read own conversation thread summaries" on public.inbox_ai_thread_summaries;

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
    or (
      scope = 'unlinked_timeline'
      and user_id = (select auth.uid())
      and exists (
        select 1
        from public.inbox_conversations c
        where c.user_id = (select auth.uid())
          and c.status = 'open'
          and c.person_id is null
          and c.channel = inbox_ai_thread_summaries.unlinked_channel
          and c.primary_handle = inbox_ai_thread_summaries.unlinked_handle
      )
    )
  );
