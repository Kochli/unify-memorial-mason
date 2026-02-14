-- Deduplication: one row per (channel, external_message_id) for inbox_messages.
-- Replaces the previous unique index on external_message_id alone so the same
-- external id can exist in different channels (e.g. SMS vs email).

drop index if exists public.idx_inbox_messages_external_message_id;

create unique index if not exists idx_inbox_messages_channel_external_message_id
  on public.inbox_messages (channel, external_message_id)
  where external_message_id is not null;

comment on index public.idx_inbox_messages_channel_external_message_id is
  'Enforce dedupe per channel by (channel, external_message_id) for inbound webhooks.';
