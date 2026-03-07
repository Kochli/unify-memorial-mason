import React, { createContext, useContext, useState, useCallback } from 'react';

/** Single source of truth for sidebar widths (desktop). */
export const SIDEBAR_WIDTH_EXPANDED_PX = 140;
export const SIDEBAR_WIDTH_COLLAPSED_PX = 40;

export interface SidebarLayoutContextValue {
  /** Desktop sidebar collapsed (icon rail). */
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(null);

export function SidebarLayoutProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const setCollapsedStable = useCallback((value: boolean) => setCollapsed(value), []);
  const value: SidebarLayoutContextValue = React.useMemo(
    () => ({ collapsed, setCollapsed: setCollapsedStable }),
    [collapsed, setCollapsedStable]
  );
  return (
    <SidebarLayoutContext.Provider value={value}>
      {children}
    </SidebarLayoutContext.Provider>
  );
}

export function useSidebarLayout(): SidebarLayoutContextValue {
  const ctx = useContext(SidebarLayoutContext);
  if (!ctx) {
    throw new Error('useSidebarLayout must be used within SidebarLayoutProvider');
  }
  return ctx;
}
