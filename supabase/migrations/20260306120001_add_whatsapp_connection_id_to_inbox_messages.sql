-- Add whatsapp_connection_id to inbox_messages for attribution when channel is whatsapp.

alter table public.inbox_messages
  add column if not exists whatsapp_connection_id uuid references public.whatsapp_connections(id) on delete set null;

create index if not exists idx_inbox_messages_whatsapp_connection_id
  on public.inbox_messages (whatsapp_connection_id);

comment on column public.inbox_messages.whatsapp_connection_id is 'WhatsApp connection used for this message when channel is whatsapp.';
