-- Allow authenticated users to create their own inbox_conversations (for New Conversation feature).
-- user_id must be set to auth.uid() so RLS allows the insert.

drop policy if exists "Users can insert own inbox_conversations" on public.inbox_conversations;
create policy "Users can insert own inbox_conversations"
  on public.inbox_conversations for insert to authenticated
  with check (user_id = (select auth.uid()));
