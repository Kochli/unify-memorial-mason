import React, { useState, useRef } from 'react';
import { Card, CardContent } from "@/shared/components/ui/card";
import { Mail } from 'lucide-react';
import { useConversation } from "@/modules/inbox/hooks/useInboxConversations";
import { useMessagesByConversation } from "@/modules/inbox/hooks/useInboxMessages";
import { useCustomer } from '@/modules/customers/hooks/useCustomers';
import { LinkConversationModal } from './LinkConversationModal';
import { ConversationHeader } from './ConversationHeader';
import { ConversationThread } from './ConversationThread';

interface ConversationViewProps {
  conversationId: string | null;
}

export const ConversationView: React.FC<ConversationViewProps> = ({ conversationId }) => {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = useConversation(conversationId);
  const { data: messages = [] } = useMessagesByConversation(conversationId);
  const { data: person } = useCustomer(conversation?.person_id ?? '');

  if (!conversationId || !conversation) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center text-slate-400">
            <Mail className="h-12 w-12 mx-auto mb-4" />
            <p>Select a conversation to view messages</p>
          </div>
        </CardContent>
      </Card>
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

  return (
    <div className="h-full flex flex-col min-h-0 min-w-0 overflow-hidden">
      <LinkConversationModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        conversationId={conversation.id}
        conversationPersonId={conversation.person_id}
        candidates={conversation.link_meta?.candidates}
        onLinked={() => setLinkModalOpen(false)}
        onUnlinked={() => setLinkModalOpen(false)}
      />

      <ConversationHeader
        displayName={personDisplay ?? conversation.primary_handle}
        secondaryLine={`${conversation.channel} · ${conversation.primary_handle}`}
        linkStateLabel={linkStateLabel}
        actionButtonLabel={isUnlinked ? 'Link person' : 'Change link'}
        onActionClick={() => setLinkModalOpen(true)}
      />

      <ConversationThread
        messages={messages}
        readOnly={false}
        conversationId={conversationId}
        channel={conversation.channel as 'email' | 'sms' | 'whatsapp'}
        scrollContainerRef={messagesContainerRef}
      />
    </div>
  );
};

export default ConversationView;
