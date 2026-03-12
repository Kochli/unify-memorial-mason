import React from 'react';
import { cn } from '@/shared/lib/utils';

const CHANNEL_LABELS: Record<'email' | 'sms' | 'whatsapp', string> = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

export type ReplyChannel = 'email' | 'sms' | 'whatsapp';

export interface ReplyChannelPillsProps {
  channels: ReplyChannel[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/** Segmented pill control for reply channel. Selected = dark green; unselected = light grey. */
export const ReplyChannelPills: React.FC<ReplyChannelPillsProps> = ({
  channels,
  value,
  onChange,
  disabled = false,
  className,
}) => (
  <div className={cn('flex items-center gap-1 flex-wrap', className)}>
    {channels.map((ch) => {
      const isSelected = value === ch;
      return (
        <button
          key={ch}
          type="button"
          disabled={disabled}
          onClick={() => onChange(ch)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
            isSelected
              ? 'bg-emerald-700 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          {CHANNEL_LABELS[ch]}
        </button>
      );
    })}
  </div>
);
