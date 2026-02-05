import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { Send } from 'lucide-react';
import { formatMessageTimestamp } from '@/modules/inbox/utils/conversationUtils';
import { useSendReply } from '@/modules/inbox/hooks/useInboxMessages';
import type { InboxMessage } from '@/modules/inbox/types/inbox.types';

function isLikelyHtml(body: string): boolean {
  if (!body || typeof body !== 'string') return false;
  return (
    /<\/?[a-z][\s\S]*>/i.test(body) &&
    (body.includes('<html') || body.includes('<div') || body.includes('<table') || body.includes('<body'))
  );
}

function sanitizeHtml(html: string): string {
  let out = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    .replace(/<meta[\s\S]*?>/gi, '');
  return out;
}

export interface ConversationThreadProps {
  messages: InboxMessage[];
  /** When true, do not render the reply composer. */
  readOnly?: boolean;
  /** When set (e.g. All tab), clicking a message opens that thread. Ignored when readOnly is false. */
  onMessageClick?: (message: InboxMessage) => void;
  /** For editable view: conversation id and channel for sending replies. */
  conversationId?: string | null;
  channel?: 'email' | 'sms' | 'whatsapp';
  /** Optional ref to attach to the scroll container (e.g. for auto-scroll to bottom). */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  messages,
  readOnly = false,
  onMessageClick,
  conversationId,
  channel,
  scrollContainerRef,
}) => {
  const [replyText, setReplyText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawHtmlMessageIds, setRawHtmlMessageIds] = useState<Set<string>>(new Set());
  const sendReplyMutation = useSendReply();

  const toggleRawHtml = (messageId: string) => {
    setRawHtmlMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
  }, [messages, scrollContainerRef]);

  const handleSendReply = () => {
    if (!conversationId || !replyText.trim() || !channel) return;
    setErrorMessage(null);
    sendReplyMutation.mutate(
      { conversationId, bodyText: replyText, channel },
      {
        onSuccess: () => setReplyText(''),
        onError: (error) => setErrorMessage(error instanceof Error ? error.message : 'Failed to send message'),
      }
    );
  };

  const emptyState = (
    <div className="text-center text-slate-400 py-8">
      <p>No messages in this conversation</p>
    </div>
  );

  const messageList =
    messages.length === 0 ? (
      emptyState
    ) : (
      <>
        {messages.map((message) => {
          const isInbound = message.direction === 'inbound';
          const isEmail = message.channel === 'email';
          const body = message.body_text ?? '';
          const showAsHtml = isEmail && isLikelyHtml(body);
          const showRaw = showAsHtml && rawHtmlMessageIds.has(message.id);
          const isClickable = readOnly && !!onMessageClick;

          const bubble = (
            <div
              key={message.id}
              role={isClickable ? 'button' : undefined}
              className={`flex min-w-0 ${isInbound ? 'justify-start' : 'justify-end'} ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={isClickable ? () => onMessageClick(message) : undefined}
            >
              <div
                className={`min-w-0 px-4 py-2 rounded-lg overflow-hidden ${
                  showAsHtml ? 'max-w-full' : 'max-w-[75%]'
                } ${
                  isInbound ? 'bg-slate-100 text-slate-900' : 'bg-blue-500 text-white'
                } ${isClickable ? 'hover:opacity-90' : ''}`}
              >
                {showAsHtml ? (
                  <>
                    {showRaw ? (
                      <pre className="text-xs whitespace-pre-wrap break-words font-sans">{body}</pre>
                    ) : (
                      <div className="min-w-0 overflow-hidden max-w-full">
                        <iframe
                          sandbox=""
                          srcDoc={sanitizeHtml(body)}
                          title="Email content"
                          className="w-full max-w-full min-h-[60px] max-h-48 border-0 bg-white text-slate-900"
                        />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs mt-1 -ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRawHtml(message.id);
                      }}
                    >
                      {showRaw ? 'View formatted' : 'View raw'}
                    </Button>
                  </>
                ) : (
                  <p className={`text-sm whitespace-pre-wrap break-words ${isEmail ? 'break-all' : ''}`}>
                    {body}
                  </p>
                )}
                <p
                  className={`text-xs mt-1 shrink-0 ${isInbound ? 'text-slate-500' : 'text-blue-100'}`}
                >
                  {formatMessageTimestamp(message.sent_at)}
                </p>
              </div>
            </div>
          );
          return bubble;
        })}
      </>
    );

  return (
    <Card className="flex-1 flex flex-col min-w-0 min-h-0">
      <CardHeader className="shrink-0">
        <CardTitle className="text-base">Conversation</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="flex-1 min-w-0 space-y-4 overflow-y-auto overflow-x-hidden max-h-96 mb-4"
        >
          {messageList}
        </div>

        {!readOnly && (
          <div className="border-t pt-4 min-w-0 shrink-0">
            <Textarea
              placeholder="Type your reply..."
              className="mb-3"
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            {errorMessage && <p className="mb-2 text-xs text-red-600">{errorMessage}</p>}
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSendReply}
                disabled={!replyText.trim() || sendReplyMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {sendReplyMutation.isPending ? 'Sending...' : 'Send Reply'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
