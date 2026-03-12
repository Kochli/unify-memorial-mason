import React from 'react';
import { cn } from '@/shared/lib/utils';

export type InboxStatusBadgeVariant = 'urgent' | 'unlinked' | 'action' | 'channel';

export interface InboxStatusBadgeProps {
  variant: InboxStatusBadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<InboxStatusBadgeVariant, string> = {
  urgent: 'bg-red-600 text-white',
  unlinked: 'bg-violet-500 text-white',
  action: 'bg-amber-600 text-white',
  channel: 'bg-slate-100 text-slate-700 border border-slate-200',
};

/** Status badge for list/header. Mockup-aligned colors (red urgent, violet unlinked, amber action, neutral channel). */
export const InboxStatusBadge: React.FC<InboxStatusBadgeProps> = ({
  variant,
  children,
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded',
      variantClasses[variant],
      className
    )}
  >
    {children}
  </span>
);
