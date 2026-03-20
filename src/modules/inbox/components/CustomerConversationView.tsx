import React, { useMemo, useRef } from 'react';
import { useCustomer } from '@/modules/customers/hooks/useCustomers';
import { useConversationsList } from '@/modules/inbox/hooks/useInboxConversations';
import { buildConversationIdByChannel, useCustomerMessages } from '@/modules/inbox/hooks/useInboxMessages';
import { ConversationHeader } from './ConversationHeader';
import { ConversationThread } from './ConversationThread';

interface CustomerConversationViewProps {
  personId: string | null;
}

export const CustomerConversationView: React.FC<CustomerConversationViewProps> = ({ personId }) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { data: person } = useCustomer(personId ?? '');
  const { data: conversations = [] } = useConversationsList(
    personId ? { status: 'open', person_id: personId } : undefined
  );
  const { messages, isLoading, isError } = useCustomerMessages(personId);

  const personDisplay = person
    ? [person.first_name, person.last_name].filter(Boolean).join(' ').trim() || person.email || person.phone || '—'
    : '—';

  const { conversationIdByChannel, defaultChannel } = useMemo(() => {
    const map = buildConversationIdByChannel(conversations, messages);
    const latestInbound = messages.slice().reverse().find((m) => m.direction === 'inbound')?.channel ?? null;
    const firstEnabled = (['email', 'sms', 'whatsapp'] as const).find((channel) => !!map[channel]) ?? 'email';
    return {
      conversationIdByChannel: map,
      defaultChannel: latestInbound ?? firstEnabled,
    };
  }, [conversations, messages]);

  if (!personId) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-6">
        <p className="text-sm text-slate-500">Select a customer thread to view messages</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-6">
        <p className="text-sm text-slate-500">Unable to load customer timeline</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden">
      <div className="shrink-0">
        <ConversationHeader
          displayName={personDisplay}
          handleLine="all channels"
          linkStateLabel="Linked"
          actionButtonLabel={undefined}
        />
      </div>
      <ConversationThread
        messages={messages}
        readOnly={false}
        conversationIdByChannel={conversationIdByChannel}
        defaultChannel={defaultChannel}
        participantName={personDisplay}
        scrollContainerRef={scrollContainerRef}
        conditionalAutoScroll
        autoScrollResetKey={personId}
      />
      {isLoading && <div className="text-center text-xs text-slate-400 py-2">Loading messages...</div>}
    </div>
  );
};

