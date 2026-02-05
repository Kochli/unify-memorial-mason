/**
 * DrawerGrid — Responsive grid for form field pairs/triplets.
 * Use for First/Last name, City/Country, dates side-by-side, etc.
 * Children get min-w-0 to prevent overflow.
 */
import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface DrawerGridProps {
  cols?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

export const DrawerGrid: React.FC<DrawerGridProps> = ({
  cols = 2,
  children,
  className,
}) => {
  const gridCols =
    cols === 1
      ? 'grid-cols-1'
      : cols === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={cn('grid gap-3', gridCols, '[&>*]:min-w-0', className)}>
      {children}
    </div>
  );
};
