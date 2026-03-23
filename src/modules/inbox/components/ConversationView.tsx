import React, { useState, useRef } from 'react';
import { Mail } from 'lucide-react';
import { useConversation } from "@/modules/inbox/hooks/useInboxConversations";
import { useMessagesByConversation } from "@/modules/inbox/hooks/useInboxMessages";
import { useCustomer } from '@/modules/customers/hooks/useCustomers';
import { useOrdersByPersonId } from '@/modules/orders/hooks/useOrders';
import { getOrderDisplayId } from '@/modules/orders/utils/orderDisplayId';
import { LinkConversationModal } from './LinkConversationModal';
import { ConversationHeader } from './ConversationHeader';
import { ConversationSummaryBanner } from './ConversationSummaryBanner';
import { ConversationThread } from './ConversationThread';
import { useThreadSummary } from '@/modules/inbox/hooks/useThreadSummary';

const HEADER_ORDERS_MAX = 5;
function formatOrderIdsForHeader(orderIds: string[], max: number = HEADER_ORDERS_MAX): string {
  if (orderIds.length === 0) return '';
  const show = orderIds.slice(0, max);
  const suffix = orderIds.length > max ? ', ...' : '';
  return show.join(', ') + suffix;
}

interface ConversationViewProps {
  conversationId: string | null;
  onReplyChannelChange?: (channel: 'email' | 'sms' | 'whatsapp') => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversationId,
  onReplyChannelChange,
}) => {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = useConversation(conversationId);
  const { data: messages = [] } = useMessagesByConversation(conversationId);
  const { data: person } = useCustomer(conversation?.person_id ?? '');
  const { data: personOrders = [] } = useOrdersByPersonId(conversation?.person_id ?? '');
  const threadSummary = useThreadSummary({
    scope: 'conversation',
    conversationId: conversationId ?? null,
  });

  if (!conversationId || !conversation) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4" />
          <p className="text-sm">Select a conversation to view messages</p>
        </div>
      </div>
    );
  }

  const personDisplay = person
    ? [person.first_name, person.last_name].filter(Boolean).join(' ').trim() || person.email || person.phone || '—'
    : null;

  const linkStateLabel =
    (conversation.link_state ?? 'unlinked') === 'ambiguous'
      ? 'Ambiguous'
      : (conversation.link_state ?? 'unlinked') === 'linked'
        ? 'Linked'
        : 'Not linked';

  const isUnlinked = !conversation.person_id || ((conversation.link_state ?? 'unlinked') !== 'linked');
  const subject = conversation.subject?.trim() || null;
  const handleLine = `${conversation.channel} · ${conversation.primary_handle}`;

  const relatedOrderIds = personOrders.map(getOrderDisplayId);
  const orderDisplayIdsText = relatedOrderIds.length > 0 ? formatOrderIdsForHeader(relatedOrderIds) : null;

  const summaryBannerBusy =
    threadSummary.isLoading ||
    (threadSummary.isFetching && !threadSummary.summary?.trim());

  const showSummarySlot =
    summaryBannerBusy ||
    threadSummary.error != null ||
    !!(threadSummary.summary && threadSummary.summary.trim());

  return (
    <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden">
      <LinkConversationModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        conversationId={conversation.id}
        conversationPersonId={conversation.person_id}
        candidates={conversation.link_meta?.candidates}
        onLinked={() => setLinkModalOpen(false)}
        onUnlinked={() => setLinkModalOpen(false)}
      />

      <div className="shrink-0">
        <ConversationHeader
          displayName={personDisplay ?? conversation.primary_handle}
          handleLine={handleLine}
          subjectLine={subject}
          linkStateLabel={linkStateLabel}
          orderDisplayIdsText={orderDisplayIdsText}
          actionButtonLabel={isUnlinked ? 'Link person' : 'Change link'}
          onActionClick={() => setLinkModalOpen(true)}
          summarySlot={
            showSummarySlot ? (
              <ConversationSummaryBanner
                summary={threadSummary.summary}
                isLoading={summaryBannerBusy}
                error={threadSummary.error}
              />
            ) : undefined
          }
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ConversationThread
        messages={messages}
        readOnly={false}
        conversationId={conversationId}
        channel={conversation.channel as 'email' | 'sms' | 'whatsapp'}
        participantName={personDisplay ?? null}
        onReplyChannelChange={onReplyChannelChange}
        scrollContainerRef={messagesContainerRef}
        conversationSubject={conversation.subject}
      />
      </div>
    </div>
  );
};

export default ConversationView;
