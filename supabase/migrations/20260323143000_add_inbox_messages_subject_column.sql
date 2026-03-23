-- Add per-message email subject storage (used by Customers-tab message header UI)

alter table public.inbox_messages
  add column if not exists subject text;

-- Backfill existing email messages from their parent conversation subject.
-- Normalize legacy placeholder '(no subject)' to null.
update public.inbox_messages m
set subject =
  case
    when c.subject is null then null
    when lower(btrim(c.subject)) = '(no subject)' then null
    else c.subject
  end
from public.inbox_conversations c
where m.conversation_id = c.id
  and m.channel = 'email'
  and (
    m.subject is null
    or btrim(coalesce(m.subject, '')) = ''
    or lower(btrim(m.subject)) = '(no subject)'
  );

