import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchConversations,
  fetchConversation,
  updateConversation,
  markConversationsAsRead,
  markConversationsAsUnread,
  archiveConversations,
  linkConversation,
  unlinkConversation,
} from '../api/inboxConversations.api';
import { syncGmail } from '../api/inboxGmail.api';
import type { ConversationFilters } from '../types/inbox.types';

export const inboxKeys = {
  conversations: {
    all: ['inbox', 'conversations'] as const,
    lists: (filters?: ConversationFilters) => ['inbox', 'conversations', 'list', filters] as const,
    detail: (id: string) => ['inbox', 'conversations', id] as const,
  },
  messages: {
    byConversation: (id: string) => ['inbox', 'messages', 'conversation', id] as const,
    personTimeline: (personId: string, conversationIds: string[]) =>
      ['inbox', 'messages', 'personTimeline', personId, conversationIds] as const,
  },
  channels: {
    all: ['inbox', 'channels'] as const,
  },
};

export function useConversationsList(filters?: ConversationFilters) {
  return useQuery({
    queryKey: inboxKeys.conversations.lists(filters),
    queryFn: () => fetchConversations(filters),
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: inboxKeys.conversations.detail(id!),
    queryFn: () => fetchConversation(id!),
    enabled: !!id,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => markConversationsAsRead(ids),
    retry: 0,
    onMutate: async (ids: string[]) => {
      // Optimistically set unread_count = 0 for targeted conversations
      const previous = queryClient.getQueriesData<unknown>({ queryKey: inboxKeys.conversations.all });

      previous.forEach(([key, value]) => {
        const conversations = value as InboxConversation[] | undefined;
        if (!conversations) return;

        const updated = conversations.map((conversation) =>
          ids.includes(conversation.id)
            ? { ...conversation, unread_count: 0 }
            : conversation
        );

        queryClient.setQueryData(key, updated);
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      // Roll back optimistic update if something goes wrong
      if (!context?.previous) return;
      context.previous.forEach(([key, value]: [unknown, unknown]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      // Invalidate all conversation list queries to resync with server
      queryClient.invalidateQueries({ queryKey: inboxKeys.conversations.all });
    },
  });
}

export function useMarkAsUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => markConversationsAsUnread(ids),
    retry: 0,
    onMutate: async (ids: string[]) => {
      // Optimistically set unread_count = 1 for targeted conversations
      const previous = queryClient.getQueriesData<unknown>({ queryKey: inboxKeys.conversations.all });

      previous.forEach(([key, value]) => {
        const conversations = value as InboxConversation[] | undefined;
        if (!conversations) return;

        const updated = conversations.map((conversation) =>
          ids.includes(conversation.id)
            ? { ...conversation, unread_count: 1 }
            : conversation
        );

        queryClient.setQueryData(key, updated);
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      // Roll back optimistic update if something goes wrong
      if (!context?.previous) return;
      context.previous.forEach(([key, value]: [unknown, unknown]) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      // Invalidate all conversation list queries to resync with server
      queryClient.invalidateQueries({ queryKey: inboxKeys.conversations.all });
    },
  });
}

export function useArchiveConversations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => archiveConversations(ids),
    onSuccess: () => {
      // Invalidate all conversation list queries
      queryClient.invalidateQueries({ queryKey: inboxKeys.conversations.all });
    },
  });
}

export function useSyncGmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options?: { since?: string; maxMessages?: number }) => syncGmail(options),
    onSuccess: () => {
      // Invalidate all conversation list queries to show new emails
      queryClient.invalidateQueries({ queryKey: inboxKeys.conversations.all });
    },
  });
}

export function useLinkConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, personId }: { conversationId: string; personId: string }) =>
      linkConversation(conversationId, personId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.conversations.all });
      queryClient.invalidateQueries({ queryKey: inboxKeys.conversations.detail(variables.conversationId) });
    },
  });
}

export function useUnlinkConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => unlinkConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.conversations.all });
      queryClient.invalidateQueries({ queryKey: inboxKeys.conversations.detail(conversationId) });
    },
  });
}
