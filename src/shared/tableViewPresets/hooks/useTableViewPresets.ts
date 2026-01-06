import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPresetsByModule,
  createPreset,
  updatePreset,
  deletePreset,
  setDefaultPreset,
} from '../api/tableViewPresets.api';
import type {
  TableViewPreset,
  TableViewPresetInsert,
  TableViewPresetUpdate,
} from '../types/tableViewPresets.types';

/**
 * Fetch presets for a module with React Query caching
 * @param module - Module identifier ('orders' | 'invoices')
 */
export function usePresetsByModule(module: string) {
  return useQuery({
    queryKey: ['table_view_presets', module],
    queryFn: () => fetchPresetsByModule(module),
  });
}

/**
 * Create preset mutation
 */
export function useCreatePreset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preset: TableViewPresetInsert) => createPreset(preset),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['table_view_presets', data.module] 
      });
    },
  });
}

/**
 * Update preset mutation
 */
export function useUpdatePreset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TableViewPresetUpdate> }) =>
      updatePreset(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['table_view_presets', data.module] 
      });
    },
  });
}

/**
 * Delete preset mutation
 */
export function useDeletePreset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deletePreset(id),
    onSuccess: () => {
      // Invalidate all module queries (we don't know which module)
      queryClient.invalidateQueries({ 
        queryKey: ['table_view_presets'] 
      });
    },
  });
}

/**
 * Set default preset mutation
 */
export function useSetDefaultPreset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ module, presetId }: { module: string; presetId: string }) =>
      setDefaultPreset(module, presetId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['table_view_presets', data.module] 
      });
    },
  });
}

