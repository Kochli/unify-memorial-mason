-- People ↔ Inbox linking: person_id, link_state, link_meta
-- Affected: public.inbox_conversations
-- Adds FK to customers, indexes for filtering.

-- person_id: FK to customers (People)
alter table public.inbox_conversations
  add column if not exists person_id uuid
  references public.customers(id) on delete set null;

comment on column public.inbox_conversations.person_id is 'Linked person (customer) when link_state=linked.';

-- link_state: linked | unlinked | ambiguous
alter table public.inbox_conversations
  add column if not exists link_state text not null default 'unlinked'
  check (link_state in ('linked','unlinked','ambiguous'));

comment on column public.inbox_conversations.link_state is 'Auto-link state: linked, unlinked, or ambiguous (multiple matches).';

-- link_meta: candidates for ambiguous, matched_on field
alter table public.inbox_conversations
  add column if not exists link_meta jsonb not null default '{}'::jsonb;

comment on column public.inbox_conversations.link_meta is 'Ambiguous: { candidates: [uuid], matched_on: "email"|"phone" }.';

-- Index: per-person conversation list
create index if not exists idx_inbox_conversations_person_id_last_message_at
  on public.inbox_conversations (person_id, last_message_at desc nulls last)
  where person_id is not null;

-- Index: unlinked / ambiguous filters
create index if not exists idx_inbox_conversations_link_state_last_message_at
  on public.inbox_conversations (link_state, last_message_at desc nulls last);
