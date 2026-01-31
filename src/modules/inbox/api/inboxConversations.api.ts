import { supabase } from '@/shared/lib/supabase';
import type { InboxConversation, InboxConversationInsert, InboxConversationUpdate, ConversationFilters } from '../types/inbox.types';

export async function fetchConversations(filters?: ConversationFilters) {
  let query = supabase
    .from('inbox_conversations')
    .select('*');

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  } else {
    // Default: open conversations only
    query = query.eq('status', 'open');
  }

  if (filters?.channel) {
    query = query.eq('channel', filters.channel);
  }

  if (filters?.unread_only) {
    query = query.gt('unread_count', 0);
  }

  if (filters?.person_id != null && filters.person_id !== '') {
    query = query.eq('person_id', filters.person_id);
  } else if (filters?.unlinked_only) {
    query = query.is('person_id', null);
  }

  // Search: ILIKE over primary_handle, subject, last_message_preview
  if (filters?.search && filters.search.trim()) {
    const searchTerm = filters.search.trim();
    query = query.or(`primary_handle.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%,last_message_preview.ilike.%${searchTerm}%`);
  }

  // Sort: last_message_at DESC NULLS LAST, fallback created_at DESC
  query = query
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as InboxConversation[];
}

export async function fetchConversation(id: string) {
  const { data, error } = await supabase
    .from('inbox_conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as InboxConversation;
}

export async function updateConversation(id: string, updates: InboxConversationUpdate) {
  const { data, error } = await supabase
    .from('inbox_conversations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as InboxConversation;
}

export async function markConversationsAsRead(ids: string[]) {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('inbox_conversations')
    .update({ unread_count: 0 })
    .in('id', ids)
    .select();

  if (error) throw error;
  return (data || []) as InboxConversation[];
}

export async function archiveConversations(ids: string[]) {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('inbox_conversations')
    .update({ status: 'archived' })
    .in('id', ids)
    .select();

  if (error) throw error;
  return (data || []) as InboxConversation[];
}

export async function linkConversation(conversationId: string, personId: string): Promise<InboxConversation> {
  const { data, error } = await supabase
    .from('inbox_conversations')
    .update({
      person_id: personId,
      link_state: 'linked',
      link_meta: {},
    })
    .eq('id', conversationId)
    .select()
    .single();

  if (error) throw error;
  return data as InboxConversation;
}

export async function unlinkConversation(conversationId: string): Promise<InboxConversation> {
  const { data, error } = await supabase
    .from('inbox_conversations')
    .update({
      person_id: null,
      link_state: 'unlinked',
      link_meta: {},
    })
    .eq('id', conversationId)
    .select()
    .single();

  if (error) throw error;
  return data as InboxConversation;
}
