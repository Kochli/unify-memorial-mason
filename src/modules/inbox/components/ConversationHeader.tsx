import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface ConversationHeaderProps {
  displayName: string;
  handleLine: string;
  subjectLine?: string | null;
  linkStateLabel: string;
  orderDisplayIdsText?: string | null;
  actionButtonLabel?: string;
  onActionClick?: () => void;
}

/** Conversation header. Custom styling only (no shadcn Avatar/Button). */
export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  displayName,
  handleLine,
  subjectLine = null,
  linkStateLabel,
  orderDisplayIdsText,
  actionButtonLabel,
  onActionClick,
}) => {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shrink-0 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-semibold text-slate-900 truncate">
              {displayName}
            </span>
            {orderDisplayIdsText && (
              <span className="text-[11px] font-mono text-slate-500 truncate min-w-0">
                {orderDisplayIdsText}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate mt-0.5">{handleLine}</p>
          {subjectLine && (
            <p className="text-[12px] text-slate-600 truncate mt-0.5">
              {subjectLine}
            </p>
          )}
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
          {linkStateLabel}
        </span>
      </div>
      {actionButtonLabel != null && (
        <button
          type="button"
          onClick={onActionClick}
          className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          {actionButtonLabel}
        </button>
      )}
    </div>
  );
};
