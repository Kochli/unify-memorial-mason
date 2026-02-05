/**
 * DrawerSection — Compact section container for drawer form content.
 * Use for grouping related fields. Optional collapsible variant for Notes/Additional Options.
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import { cn } from '@/shared/lib/utils';

export interface DrawerSectionProps {
  title?: string;
  /** When true, section is collapsible. Default open when defaultOpen=true. */
  collapsible?: boolean;
  /** When collapsible, start open (true) or closed (false). */
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const DrawerSection: React.FC<DrawerSectionProps> = ({
  title,
  collapsible = false,
  defaultOpen = true,
  children,
  className,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const header = title && (
    <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {title}
    </div>
  );

  if (collapsible && title) {
    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className={cn('p-4 space-y-3 border-t', className)}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 w-full text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            >
              {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              {header}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-2 space-y-3">{children}</div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div className={cn('p-4 space-y-3', title && 'border-t', className)}>
      {header}
      {children}
    </div>
  );
};
