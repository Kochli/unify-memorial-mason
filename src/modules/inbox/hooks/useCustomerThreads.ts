import { useMemo } from 'react';
import { useCustomersList } from '@/modules/customers/hooks/useCustomers';
import { useConversationsList } from './useInboxConversations';
import type { ConversationFilters, CustomerThreadRow, InboxChannel, InboxConversation } from '../types/inbox.types';

interface UseCustomerThreadsParams {
  baseFilters: ConversationFilters;
  channelFilter: 'all' | InboxChannel;
  listFilter: 'all' | 'unread' | 'urgent' | 'unlinked';
}

function isUrgent(conversation: InboxConversation): boolean {
  return /urgent/i.test(conversation.subject ?? '') || /urgent/i.test(conversation.last_message_preview ?? '');
}

export function useCustomerThreads({ baseFilters, channelFilter, listFilter }: UseCustomerThreadsParams) {
  const { data: conversations = [], isLoading, isError } = useConversationsList(baseFilters);
  const { data: customers = [] } = useCustomersList();

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((customer) => {
      const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();
      map.set(customer.id, fullName || customer.email || customer.phone || '—');
    });
    return map;
  }, [customers]);

  const rows = useMemo<CustomerThreadRow[]>(() => {
    const grouped = new Map<string, InboxConversation[]>();
    conversations.forEach((conversation) => {
      if (!conversation.person_id) return;
      if (listFilter === 'urgent' && !isUrgent(conversation)) return;
      const list = grouped.get(conversation.person_id) ?? [];
      list.push(conversation);
      grouped.set(conversation.person_id, list);
    });

    const result: CustomerThreadRow[] = [];
    grouped.forEach((group, personId) => {
      const sortedByRecent = group.slice().sort((a, b) => {
        const aTs = new Date(a.last_message_at ?? a.created_at).getTime();
        const bTs = new Date(b.last_message_at ?? b.created_at).getTime();
        return bTs - aTs;
      });
      const latest = sortedByRecent[0];
      const byChannel: CustomerThreadRow['latestConversationIdByChannel'] = {
        email: null,
        sms: null,
        whatsapp: null,
      };
      sortedByRecent.forEach((conversation) => {
        const channel = conversation.channel;
        if (!byChannel[channel]) byChannel[channel] = conversation.id;
      });

      const channels = (['email', 'sms', 'whatsapp'] as const).filter((channel) => !!byChannel[channel]);
      if (channelFilter !== 'all' && !channels.includes(channelFilter)) return;
      if (listFilter === 'unlinked') return;

      const unreadCount = group.reduce((sum, conversation) => sum + (conversation.unread_count ?? 0), 0);
      result.push({
        personId,
        displayName: customerNameById.get(personId) ?? latest.primary_handle,
        latestMessageAt: latest.last_message_at ?? latest.created_at,
        latestPreview: latest.last_message_preview ?? latest.subject ?? null,
        unreadCount,
        hasUnread: unreadCount > 0,
        channels: [...channels],
        latestConversationIdByChannel: byChannel,
        conversationIds: group.map((conversation) => conversation.id),
      });
    });

    return result.sort((a, b) => {
      const aTs = new Date(a.latestMessageAt ?? 0).getTime();
      const bTs = new Date(b.latestMessageAt ?? 0).getTime();
      if (aTs !== bTs) return bTs - aTs;
      return a.personId.localeCompare(b.personId);
    });
  }, [conversations, customerNameById, channelFilter, listFilter]);

  return { rows, isLoading, isError };
}

