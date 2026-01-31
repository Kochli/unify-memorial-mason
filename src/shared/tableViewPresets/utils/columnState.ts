import type { PresetConfig, ColumnState } from '../types/tableViewPresets.types';
import type { ColumnDefinition } from '../config/defaultColumns';
import {
  getColumnDefinitions,
  getDefaultColumnOrder,
  getDefaultColumnVisibility,
  getDefaultColumnWidths,
} from '../config/defaultColumns';

/**
 * Normalize a preset config against available columns
 * Handles new/removed columns safely
 * @param config - Preset config to normalize
 * @param module - Module identifier
 * @returns Normalized preset config
 */
export function normalizeConfig(
  config: PresetConfig,
  module: 'orders' | 'invoices'
): PresetConfig {
  const availableColumns = getColumnDefinitions(module);
  const availableColumnIds = new Set(availableColumns.map(col => col.id));
  
  // Normalize visibility: add missing columns (use module default), remove deleted columns
  const defaultVisibility = getDefaultColumnVisibility(module);
  const normalizedVisibility: Record<string, boolean> = {};
  availableColumns.forEach(col => {
    normalizedVisibility[col.id] = config.columns.visibility[col.id] ?? defaultVisibility[col.id] ?? true;
  });
  
  // Normalize order: filter out deleted columns, add missing columns at end
  const normalizedOrder: string[] = [];
  const seenIds = new Set<string>();
  
  // First, add columns from config order that still exist
  config.columns.order.forEach(colId => {
    if (availableColumnIds.has(colId) && !seenIds.has(colId)) {
      normalizedOrder.push(colId);
      seenIds.add(colId);
    }
  });
  
  // Then, add any missing columns at the end
  availableColumns.forEach(col => {
    if (!seenIds.has(col.id)) {
      normalizedOrder.push(col.id);
    }
  });
  
  // Normalize widths: add missing columns (use default width), remove deleted columns
  const normalizedWidths: Record<string, number> = {};
  availableColumns.forEach(col => {
    normalizedWidths[col.id] = config.columns.widths[col.id] ?? col.defaultWidth;
  });
  
  return {
    version: config.version,
    columns: {
      visibility: normalizedVisibility,
      order: normalizedOrder,
      widths: normalizedWidths,
    },
  };
}

/**
 * Apply a preset config to column state
 * @param presetConfig - Preset config to apply
 * @param module - Module identifier
 * @returns Column state
 */
export function applyPresetToState(
  presetConfig: PresetConfig,
  module: 'orders' | 'invoices'
): ColumnState {
  // Normalize config first to handle any column changes
  const normalized = normalizeConfig(presetConfig, module);
  
  return {
    visibility: normalized.columns.visibility,
    order: normalized.columns.order,
    widths: normalized.columns.widths,
  };
}

/**
 * Extract current column state to preset config format
 * @param state - Column state to extract
 * @returns Preset config
 */
export function extractStateToConfig(state: ColumnState): PresetConfig {
  return {
    version: 1,
    columns: {
      visibility: { ...state.visibility },
      order: [...state.order],
      widths: { ...state.widths },
    },
  };
}

/**
 * Get default column state for a module
 * @param module - Module identifier
 * @returns Default column state
 */
export function getDefaultState(module: 'orders' | 'invoices'): ColumnState {
  return {
    visibility: getDefaultColumnVisibility(module),
    order: getDefaultColumnOrder(module),
    widths: getDefaultColumnWidths(module),
  };
}

