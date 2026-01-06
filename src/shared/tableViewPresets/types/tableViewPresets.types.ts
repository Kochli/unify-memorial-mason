import { z } from 'zod';

// Preset config schema (JSONB structure)
export const presetConfigSchema = z.object({
  version: z.number().int().positive().default(1),
  columns: z.object({
    visibility: z.record(z.string(), z.boolean()),
    order: z.array(z.string()),
    widths: z.record(z.string(), z.number().positive()),
  }),
});

export type PresetConfig = z.infer<typeof presetConfigSchema>;

// Column state interface (matches preset config columns structure)
export interface ColumnState {
  visibility: Record<string, boolean>;
  order: string[];
  widths: Record<string, number>;
}

// Database table type
export interface TableViewPreset {
  id: string;
  module: 'orders' | 'invoices';
  name: string;
  config: PresetConfig;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Insert type (for creating presets)
export interface TableViewPresetInsert {
  module: 'orders' | 'invoices';
  name: string;
  config: PresetConfig;
  is_default?: boolean;
}

// Update type (for updating presets)
export interface TableViewPresetUpdate {
  name?: string;
  config?: PresetConfig;
  is_default?: boolean;
}

