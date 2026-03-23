import React, { useMemo, useRef } from 'react';
import { useCustomer } from '@/modules/customers/hooks/useCustomers';
import { useConversationsList } from '@/modules/inbox/hooks/useInboxConversations';
import {
  buildConversationIdByChannel,
  useCustomerMessages,
  useUnlinkedHandleTimeline,
} from '@/modules/inbox/hooks/useInboxMessages';
import { ConversationHeader } from './ConversationHeader';
import { ConversationSummaryBanner } from './ConversationSummaryBanner';
import { ConversationThread } from './ConversationThread';
import { useThreadSummary } from '@/modules/inbox/hooks/useThreadSummary';
import type { CustomersSelection } from '@/modules/inbox/types/inbox.types';

const CHANNEL_LABEL: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

interface CustomerConversationViewProps {
  customersSelection: CustomersSelection | null;
}

export const CustomerConversationView: React.FC<CustomerConversationViewProps> = ({
  customersSelection,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const linkedPersonId =
    customersSelection?.type === 'linked' ? customersSelection.personId : null;
  const unlinkedTarget =
    customersSelection?.type === 'unlinked'
      ? { channel: customersSelection.channel, handle: customersSelection.handle }
      : null;

  const threadSummaryParams =
    linkedPersonId != null
      ? ({ scope: 'customer_timeline' as const, personId: linkedPersonId } as const)
      : unlinkedTarget != null
        ? ({
            scope: 'unlinked_timeline' as const,
            channel: unlinkedTarget.channel,
            handle: unlinkedTarget.handle,
          } as const)
        : ({ scope: 'customer_timeline' as const, personId: null } as const);

  const threadSummary = useThreadSummary(threadSummaryParams);

  const { data: person } = useCustomer(linkedPersonId ?? '');
  const { data: conversations = [] } = useConversationsList(
    linkedPersonId ? { status: 'open', person_id: linkedPersonId } : undefined
  );

  const personMessages = useCustomerMessages(linkedPersonId);
  const unlinkedMessages = useUnlinkedHandleTimeline(
    unlinkedTarget?.channel ?? null,
    unlinkedTarget?.handle ?? null
  );

  const messages = linkedPersonId ? personMessages.messages : unlinkedMessages.messages;
  const isLoading = linkedPersonId ? personMessages.isLoading : unlinkedMessages.isLoading;
  const isError = linkedPersonId ? personMessages.isError : unlinkedMessages.isError;

  const personDisplay = person
    ? [person.first_name, person.last_name].filter(Boolean).join(' ').trim() || person.email || person.phone || '—'
    : '—';

  const enabledReplyChannels =
    customersSelection?.type === 'unlinked'
      ? [customersSelection.channel]
      : customersSelection?.type === 'linked' && person
        ? [
            ...(person.email?.trim() ? (['email'] as const) : []),
            ...(person.phone?.trim() ? (['sms', 'whatsapp'] as const) : []),
          ]
        : undefined;

  const headerTitle = linkedPersonId ? personDisplay : (unlinkedTarget?.handle ?? '—');
  const handleLine = linkedPersonId
    ? 'all channels'
    : unlinkedTarget
      ? CHANNEL_LABEL[unlinkedTarget.channel] ?? unlinkedTarget.channel
      : '—';
  const linkStateLabel = linkedPersonId ? 'Linked' : unlinkedTarget ? 'Unlinked' : '';

  const summaryBannerBusy =
    threadSummary.isLoading ||
    (threadSummary.isFetching && !threadSummary.summary?.trim());

  const showSummarySlot =
    summaryBannerBusy ||
    threadSummary.error != null ||
    !!(threadSummary.summary && threadSummary.summary.trim());

  const { conversationIdByChannel, defaultChannel } = useMemo(() => {
    const map = buildConversationIdByChannel(conversations, messages);
    const latestInbound = messages.slice().reverse().find((m) => m.direction === 'inbound')?.channel ?? null;
    const firstEnabled = (['email', 'sms', 'whatsapp'] as const).find((channel) => !!map[channel]) ?? 'email';
    return {
      conversationIdByChannel: map,
      defaultChannel: latestInbound ?? firstEnabled,
    };
  }, [conversations, messages]);

  const autoScrollResetKey =
    linkedPersonId ?? (unlinkedTarget ? `unlinked:${unlinkedTarget.channel}:${unlinkedTarget.handle}` : '');

  if (!customersSelection) {
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
          displayName={headerTitle}
          handleLine={handleLine}
          linkStateLabel={linkStateLabel}
          actionButtonLabel={undefined}
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
          conversationIdByChannel={conversationIdByChannel}
          defaultChannel={defaultChannel}
          participantName={headerTitle}
          scrollContainerRef={scrollContainerRef}
          conditionalAutoScroll
          autoScrollResetKey={autoScrollResetKey}
          showEmailSubjectInHeader
          enabledReplyChannels={enabledReplyChannels}
        />
      </div>
      {isLoading && <div className="text-center text-xs text-slate-400 py-2">Loading messages...</div>}
    </div>
  );
};
