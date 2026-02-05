import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';

export interface ConversationHeaderProps {
  /** Primary display name (e.g. person name or handle) */
  displayName: string;
  /** Secondary line (e.g. "email · user@example.com") */
  secondaryLine: string;
  /** Status pill label: "Linked" | "Not linked" | "Ambiguous" */
  linkStateLabel: string;
  /** Action button label, e.g. "Link person" or "Change link". Omit to hide button (e.g. read-only All tab). */
  actionButtonLabel?: string;
  /** Called when the action button is clicked. Required if actionButtonLabel is set. */
  onActionClick?: () => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  displayName,
  secondaryLine,
  linkStateLabel,
  actionButtonLabel,
  onActionClick,
}) => {
  const initials = displayName.substring(0, 2).toUpperCase() || '—';

  return (
    <div className="sticky top-0 z-10 bg-background border-b shrink-0 px-3 py-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{secondaryLine}</p>
        </div>
        <Badge variant="outline" className="text-[11px] px-1.5 py-0 shrink-0">
          {linkStateLabel}
        </Badge>
      </div>
      {actionButtonLabel != null && (
        <Button
          variant="outline"
          size="sm"
          onClick={onActionClick}
          className="shrink-0"
        >
          {actionButtonLabel}
        </Button>
      )}
    </div>
  );
};
