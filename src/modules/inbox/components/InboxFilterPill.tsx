import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface InboxFilterPillProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

/** Single filter pill for list filter bar. Selected = dark green; unselected = light grey. */
export const InboxFilterPill: React.FC<InboxFilterPillProps> = ({
  label,
  selected,
  onClick,
  className,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'px-2 py-1 text-[11px] font-medium rounded-full transition-colors',
      selected
        ? 'bg-emerald-700 text-white'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
      className
    )}
  >
    {label}
  </button>
);
