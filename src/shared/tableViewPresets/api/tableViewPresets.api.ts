import { supabase } from '@/shared/lib/supabase';
import type {
  TableViewPreset,
  TableViewPresetInsert,
  TableViewPresetUpdate,
} from '../types/tableViewPresets.types';

/**
 * Fetch all presets for a specific module
 * @param module - Module identifier ('orders' | 'invoices')
 * @returns Array of presets, ordered by default first, then name
 */
export async function fetchPresetsByModule(module: string): Promise<TableViewPreset[]> {
  const { data, error } = await supabase
    .from('table_view_presets')
    .select('*')
    .eq('module', module)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });
  
  if (error) throw error;
  return (data || []) as TableViewPreset[];
}

/**
 * Create a new preset
 * @param preset - Preset data to insert
 * @returns Created preset
 */
export async function createPreset(preset: TableViewPresetInsert): Promise<TableViewPreset> {
  // If setting as default, unset current default first
  if (preset.is_default) {
    const { error: unsetError } = await supabase
      .from('table_view_presets')
      .update({ is_default: false })
      .eq('module', preset.module)
      .eq('is_default', true);
    
    // Ignore error if no default exists (not a problem)
    if (unsetError && unsetError.code !== 'PGRST116') {
      console.warn('Error unsetting previous default:', unsetError);
    }
  }
  
  const { data, error } = await supabase
    .from('table_view_presets')
    .insert({
      ...preset,
      is_default: preset.is_default ?? false,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as TableViewPreset;
}

/**
 * Update an existing preset
 * @param id - Preset ID
 * @param updates - Fields to update
 * @returns Updated preset
 */
export async function updatePreset(
  id: string,
  updates: Partial<TableViewPresetUpdate>
): Promise<TableViewPreset> {
  // If setting as default, unset current default first
  if (updates.is_default === true) {
    // First, get the preset to know which module it belongs to
    const { data: preset } = await supabase
      .from('table_view_presets')
      .select('module')
      .eq('id', id)
      .single();
    
    if (preset) {
      const { error: unsetError } = await supabase
        .from('table_view_presets')
        .update({ is_default: false })
        .eq('module', preset.module)
        .eq('is_default', true)
        .neq('id', id);
      
      // Ignore error if no default exists (not a problem)
      if (unsetError && unsetError.code !== 'PGRST116') {
        console.warn('Error unsetting previous default:', unsetError);
      }
    }
  }
  
  const { data, error } = await supabase
    .from('table_view_presets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as TableViewPreset;
}

/**
 * Delete a preset
 * @param id - Preset ID
 */
export async function deletePreset(id: string): Promise<void> {
  const { error } = await supabase
    .from('table_view_presets')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Set a preset as the default for a module (ensures only one default)
 * @param module - Module identifier
 * @param presetId - Preset ID to set as default
 * @returns Updated preset
 */
export async function setDefaultPreset(
  module: string,
  presetId: string
): Promise<TableViewPreset> {
  // Unset current default
  const { error: unsetError } = await supabase
    .from('table_view_presets')
    .update({ is_default: false })
    .eq('module', module)
    .eq('is_default', true);
  
  // Ignore error if no default exists (not a problem)
  if (unsetError && unsetError.code !== 'PGRST116') {
    console.warn('Error unsetting previous default:', unsetError);
  }
  
  // Set new default
  const { data, error } = await supabase
    .from('table_view_presets')
    .update({ is_default: true })
    .eq('id', presetId)
    .select()
    .single();
  
  if (error) throw error;
  return data as TableViewPreset;
}

