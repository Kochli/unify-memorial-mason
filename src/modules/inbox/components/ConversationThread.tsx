import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Reply, Send, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatMessageTimestamp } from '@/modules/inbox/utils/conversationUtils';
import { useSendReply } from '@/modules/inbox/hooks/useInboxMessages';
import type { InboxMessage } from '@/modules/inbox/types/inbox.types';

const CHANNEL_LABELS: Record<'email' | 'sms' | 'whatsapp', string> = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

function getChannelBorderClass(channel: 'email' | 'sms' | 'whatsapp'): string {
  switch (channel) {
    case 'email':
      return 'border-l-2 border-red-400/60 dark:border-red-400/80';
    case 'sms':
      return 'border-l-2 border-blue-400/60 dark:border-blue-400/80';
    case 'whatsapp':
      return 'border-l-2 border-green-400/60 dark:border-green-400/80';
    default:
      return 'border-l-2 border-slate-300/50 dark:border-slate-600/50';
  }
}

function isLikelyHtml(body: string): boolean {
  if (!body || typeof body !== 'string') return false;
  return (
    /<\/?[a-z][\s\S]*>/i.test(body) &&
    (body.includes('<html') || body.includes('<div') || body.includes('<table') || body.includes('<body'))
  );
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    .replace(/<meta[\s\S]*?>/gi, '');
}

export interface ReplyToInfo {
  messageId: string;
  preview: string;
  channel: 'email' | 'sms' | 'whatsapp';
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
  /** Unified (All) tab: map channel -> conversation id; when set, composer shows channel dropdown. */
  conversationIdByChannel?: Record<'email' | 'sms' | 'whatsapp', string | null>;
  /** Initial channel when using conversationIdByChannel (overridden by replyTo.channel or most recent inbound). */
  defaultChannel?: 'email' | 'sms' | 'whatsapp';
  /** Optional "Replying to..." chip; show preview and allow clear. */
  replyTo?: ReplyToInfo | null;
  onReplyToClear?: () => void;
  /** When user clicks Reply on a message (unified mode only). */
  onReplyToMessage?: (info: { messageId: string; channel: 'email' | 'sms' | 'whatsapp'; preview?: string }) => void;
  /** Called after a reply is sent successfully (e.g. to invalidate person timeline). */
  onSendSuccess?: () => void;
  /** Optional ref to attach to the scroll container (e.g. for auto-scroll to bottom). */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

function mostRecentInboundChannel(messages: InboxMessage[]): 'email' | 'sms' | 'whatsapp' | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].direction === 'inbound') return messages[i].channel;
  }
  return null;
}

function derivePreview(msg: InboxMessage): string {
  const body = (msg.body_text ?? '').replace(/<[^>]+>/g, '').trim();
  if (msg.channel === 'email' && msg.subject?.trim()) {
    return msg.subject.trim().length > 80 ? `${msg.subject.trim().slice(0, 80)}…` : msg.subject.trim();
  }
  return body.length > 80 ? `${body.slice(0, 80)}…` : body || '(No preview)';
}

function formatHandle(value?: string | null): string | null {
  if (!value) return null;
  const out = value.trim().replace(/\s+/g, ' ');
  return out.length ? out : null;
}

function deriveSubject(message: InboxMessage): string | null {
  if (message.channel !== 'email') return null;
  const s = message.subject?.trim();
  return s && s.length ? s : null;
}

function deriveFromToLine(message: InboxMessage): string | null {
  if (message.direction === 'inbound') {
    const h = formatHandle(message.from_handle);
    return h ? `From: ${h}` : null;
  }
  if (message.direction === 'outbound') {
    const h = formatHandle(message.to_handle);
    return h ? `To: ${h}` : null;
  }
  return null;
}

function buildMetaLine(message: InboxMessage): string | null {
  const subject = deriveSubject(message);
  const fromTo = deriveFromToLine(message);
  if (!subject && !fromTo) return null;
  if (subject && fromTo) return `${subject} · ${fromTo}`;
  return subject ?? fromTo;
}

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  messages,
  readOnly = false,
  onMessageClick,
  conversationId,
  channel,
  conversationIdByChannel,
  defaultChannel,
  replyTo,
  onReplyToClear,
  onReplyToMessage,
  onSendSuccess,
  scrollContainerRef,
}) => {
  const isUnifiedMode = !!conversationIdByChannel;
  const effectiveDefault = useMemo(() => {
    if (!isUnifiedMode) return null;
    return replyTo?.channel ?? defaultChannel ?? mostRecentInboundChannel(messages) ?? 'email';
  }, [isUnifiedMode, replyTo?.channel, defaultChannel, messages]);

  const [selectedChannel, setSelectedChannel] = useState<'email' | 'sms' | 'whatsapp'>(effectiveDefault ?? 'email');
  const channelBeforeReplyRef = useRef<'email' | 'sms' | 'whatsapp'>(effectiveDefault ?? 'email');
  const [replyText, setReplyText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawHtmlMessageIds, setRawHtmlMessageIds] = useState<Set<string>>(new Set());
  const sendReplyMutation = useSendReply();
  const composerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // When replyTo is set, lock channel to replyTo.channel; when cleared, restore previous
  const channelLocked = !!replyTo;
  const effectiveChannel = channelLocked ? replyTo!.channel : selectedChannel;
  useEffect(() => {
    if (replyTo) {
      channelBeforeReplyRef.current = selectedChannel;
    } else {
      setSelectedChannel(channelBeforeReplyRef.current);
    }
    // Intentionally omit selectedChannel: we only capture it when replyTo becomes truthy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replyTo]);

  // Sync selected channel when effectiveDefault changes (e.g. person or messages change), but not when replyTo is set
  useEffect(() => {
    if (replyTo) return;
    if (effectiveDefault != null && conversationIdByChannel?.[effectiveDefault]) {
      setSelectedChannel(effectiveDefault);
      channelBeforeReplyRef.current = effectiveDefault;
    }
    // Omit replyTo so clearing replyTo does not overwrite the restored channel from the other effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveDefault, conversationIdByChannel]);

  const activeConversationId = isUnifiedMode
    ? conversationIdByChannel[effectiveChannel] ?? null
    : conversationId ?? null;
  const activeChannel = isUnifiedMode ? effectiveChannel : (channel ?? null);

  const handleReplyClick = (message: InboxMessage) => {
    const preview = derivePreview(message);
    onReplyToMessage?.({ messageId: message.id, channel: message.channel, preview });
    requestAnimationFrame(() => {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      textareaRef.current?.focus();
    });
  };
  const availableChannels = useMemo(() => {
    if (!conversationIdByChannel) return [];
    return (['email', 'sms', 'whatsapp'] as const).filter(
      (ch) => conversationIdByChannel[ch] != null
    );
  }, [conversationIdByChannel]);

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
    if (!activeConversationId || !replyText.trim() || !activeChannel) return;
    setErrorMessage(null);
    sendReplyMutation.mutate(
      { conversationId: activeConversationId, bodyText: replyText, channel: activeChannel },
      {
        onSuccess: () => {
          setReplyText('');
          onReplyToClear?.();
          onSendSuccess?.();
        },
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
          const showReplyAction = isUnifiedMode && !!onReplyToMessage && !readOnly;
          const metaLine = buildMetaLine(message);

          const bubble = (
            <div
              key={message.id}
              role={isClickable ? 'button' : undefined}
              className={`flex min-w-0 ${isInbound ? 'justify-start' : 'justify-end'} ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={isClickable ? () => onMessageClick(message) : undefined}
            >
              <div
                className={cn(
                  'min-w-0 px-4 py-2 rounded-lg overflow-hidden relative group border-l-2',
                  getChannelBorderClass(message.channel as 'email' | 'sms' | 'whatsapp'),
                  showAsHtml ? 'max-w-full' : 'max-w-[75%]',
                  isInbound ? 'bg-slate-100 text-slate-900' : 'bg-blue-500 text-white',
                  isClickable ? 'hover:opacity-90' : ''
                )}
              >
                {metaLine && (
                  <p className="text-[11px] text-muted-foreground truncate mb-1">
                    {metaLine}
                  </p>
                )}
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
                <div className="flex items-center justify-between gap-2 mt-1 min-w-0">
                  <p
                    className={`text-xs shrink-0 ${isInbound ? 'text-slate-500' : 'text-blue-100'}`}
                  >
                    {formatMessageTimestamp(message.sent_at)}
                  </p>
                  {showReplyAction && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs opacity-70 group-hover:opacity-100 -mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReplyClick(message);
                      }}
                      aria-label="Reply"
                    >
                      <Reply className="h-3.5 w-3.5 mr-0.5" />
                      Reply
                    </Button>
                  )}
                </div>
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
          <div ref={composerRef} className="border-t pt-4 min-w-0 shrink-0">
            {replyTo && (
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Replying to:</span>
                <span
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
                  title={replyTo.preview}
                >
                  {replyTo.preview.length > 40 ? `${replyTo.preview.slice(0, 40)}…` : replyTo.preview}
                  {onReplyToClear && (
                    <button
                      type="button"
                      onClick={onReplyToClear}
                      className="rounded p-0.5 hover:bg-muted-foreground/20"
                      aria-label="Clear reply-to"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              </div>
            )}
            {isUnifiedMode && availableChannels.length > 0 && (
              <div className="mb-3">
                <Select
                  value={availableChannels.includes(effectiveChannel) ? effectiveChannel : availableChannels[0]}
                  onValueChange={(v) => setSelectedChannel(v as 'email' | 'sms' | 'whatsapp')}
                  disabled={channelLocked}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChannels.map((ch) => (
                      <SelectItem key={ch} value={ch}>
                        {CHANNEL_LABELS[ch]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Textarea
              ref={textareaRef}
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
                disabled={
                  !replyText.trim() ||
                  sendReplyMutation.isPending ||
                  !activeConversationId ||
                  !activeChannel
                }
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
