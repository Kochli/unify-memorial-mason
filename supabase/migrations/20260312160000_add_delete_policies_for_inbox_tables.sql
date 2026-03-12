-- Allow authenticated users to delete their own inbox rows.
-- Needed for "Delete" action in Unified Inbox.

drop policy if exists "Users can delete own inbox_conversations" on public.inbox_conversations;
create policy "Users can delete own inbox_conversations"
  on public.inbox_conversations for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can delete own inbox_messages" on public.inbox_messages;
create policy "Users can delete own inbox_messages"
  on public.inbox_messages for delete to authenticated
  using (user_id = (select auth.uid()));

