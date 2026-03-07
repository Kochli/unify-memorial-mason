-- Per-user WhatsApp connection (Twilio credentials). One row per user; one connected per user.
-- Status values: connected, disconnected, error. Secret stored encrypted only.

create table if not exists public.whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'twilio',
  twilio_account_sid text not null,
  twilio_api_key_sid text not null,
  twilio_api_key_secret_encrypted text not null,
  whatsapp_from text not null,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  last_error text,
  last_validated_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.whatsapp_connections.company_id is 'Optional; companies table does not exist in this project, no FK.';
comment on column public.whatsapp_connections.twilio_api_key_secret_encrypted is 'Encrypted API key secret; decrypted only in Edge Functions.';
comment on table public.whatsapp_connections is 'Per-user Twilio WhatsApp connection; one connected per user.';

create unique index idx_whatsapp_connections_one_connected_per_user
  on public.whatsapp_connections (user_id)
  where status = 'connected';

create index idx_whatsapp_connections_user_id on public.whatsapp_connections (user_id);

create index idx_whatsapp_connections_twilio_lookup
  on public.whatsapp_connections (twilio_account_sid, whatsapp_from)
  where status = 'connected';

alter table public.whatsapp_connections enable row level security;

create policy "Users can select own whatsapp_connections"
  on public.whatsapp_connections for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert own whatsapp_connections"
  on public.whatsapp_connections for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update own whatsapp_connections"
  on public.whatsapp_connections for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete own whatsapp_connections"
  on public.whatsapp_connections for delete to authenticated
  using (user_id = (select auth.uid()));
