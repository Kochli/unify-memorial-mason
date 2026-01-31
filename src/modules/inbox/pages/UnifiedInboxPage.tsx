import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Input } from "@/shared/components/ui/input";
import { Mail, Phone, MessageSquare, Search, Archive, Eye } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { ConversationView } from "../components/ConversationView";
import { PeopleSidebar } from "../components/PeopleSidebar";
import { PersonOrdersPanel } from "../components/PersonOrdersPanel";
import { useConversationsList, useConversation, useMarkAsRead, useArchiveConversations, useSyncGmail } from "@/modules/inbox/hooks/useInboxConversations";
import { formatConversationTimestamp } from "@/modules/inbox/utils/conversationUtils";
import type { ConversationFilters } from "@/modules/inbox/types/inbox.types";

export const UnifiedInboxPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: selectedConversation } = useConversation(selectedConversationId);
  const activePersonId = (selectedConversation?.person_id ?? selectedPersonId ?? null) as string | null;

  useEffect(() => {
    setSelectedOrderId(null);
  }, [activePersonId]);

  // Map tab to filters
  const filters = React.useMemo<ConversationFilters>(() => {
    const base: ConversationFilters = { status: 'open' };
    
    if (activeTab === 'unread') {
      base.unread_only = true;
    } else if (activeTab === 'email') {
      base.channel = 'email';
    } else if (activeTab === 'sms') {
      base.channel = 'sms';
    } else if (activeTab === 'whatsapp') {
      base.channel = 'whatsapp';
    }
    
    if (searchQuery.trim()) {
      base.search = searchQuery;
    }

    if (selectedPersonId != null) {
      base.person_id = selectedPersonId;
    } else {
      base.unlinked_only = true;
    }
    
    return base;
  }, [activeTab, searchQuery, selectedPersonId]);

  const { data: conversations, isLoading, isError } = useConversationsList(filters);
  const markAsReadMutation = useMarkAsRead();
  const archiveMutation = useArchiveConversations();
  const syncGmailMutation = useSyncGmail();
  const { toast } = useToast();

  const handleSyncEmail = () => {
    syncGmailMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast({
          title: 'Email sync completed',
          description: `Synced ${data.syncedCount} messages, skipped ${data.skippedCount}, ${data.errorsCount} errors`,
        });
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to sync email';
        toast({
          title: 'Email sync failed',
          description: message,
          variant: 'destructive',
        });
      },
    });
  };

  const getIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-4 w-4" />;
      case "sms":
      case "whatsapp": return <Phone className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const handleMarkAsRead = () => {
    if (selectedItems.length > 0) {
      markAsReadMutation.mutate(selectedItems);
      setSelectedItems([]);
    }
  };

  const handleArchive = () => {
    if (selectedItems.length > 0) {
      archiveMutation.mutate(selectedItems);
      setSelectedItems([]);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Unified Inbox</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage conversations from all channels
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSyncEmail}
            disabled={syncGmailMutation.isPending}
          >
            {syncGmailMutation.isPending ? 'Syncing…' : 'Sync Email'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleArchive}
            disabled={selectedItems.length === 0}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button 
            onClick={handleMarkAsRead}
            disabled={selectedItems.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Mark as Read
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex gap-0 min-h-[480px]">
        {/* People Sidebar */}
        <PeopleSidebar
          selectedPersonId={selectedPersonId}
          onSelectPerson={setSelectedPersonId}
        />
        {/* Conversations List + Conversation View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* Conversations List */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="relative">
                All
              </TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {isLoading ? (
                <Card className="p-8 text-center">
                  <div className="text-slate-400">
                    <Mail className="h-12 w-12 mx-auto mb-4" />
                    <p>Loading conversations...</p>
                  </div>
                </Card>
              ) : isError ? (
                <Card className="p-8 text-center">
                  <div className="text-slate-400">
                    <Mail className="h-12 w-12 mx-auto mb-4" />
                    <p>Unable to load conversations</p>
                  </div>
                </Card>
              ) : !conversations || conversations.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="text-slate-400">
                    <Mail className="h-12 w-12 mx-auto mb-4" />
                    <p>No conversations found</p>
                  </div>
                </Card>
              ) : (
                conversations.map((conversation) => (
                  <Card 
                    key={conversation.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedConversationId === conversation.id ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => setSelectedConversationId(conversation.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(conversation.id)}
                            onChange={() => toggleSelection(conversation.id)}
                            className="rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {getIcon(conversation.channel)}
                          <div className="flex-1">
                            <div className="font-medium">{conversation.primary_handle}</div>
                            <div className="text-sm text-slate-600 truncate">
                              {conversation.subject || conversation.last_message_preview || ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatConversationTimestamp(conversation.last_message_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-9">
                        {conversation.unread_count > 0 && (
                          <Badge variant="default" className="bg-blue-500">
                            {conversation.unread_count} unread
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {conversation.channel}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Conversation View + Person Orders Panel */}
        <div className="flex flex-col gap-4">
          <div className="min-h-[200px]">
            <ConversationView conversationId={selectedConversationId} />
          </div>
          <PersonOrdersPanel
            personId={activePersonId}
            selectedOrderId={selectedOrderId}
            onSelectOrder={setSelectedOrderId}
            onCloseOrder={() => setSelectedOrderId(null)}
          />
        </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedInboxPage;
