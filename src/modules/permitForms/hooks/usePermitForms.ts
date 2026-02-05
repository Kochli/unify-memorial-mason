import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PermitForm, PermitFormInsert, PermitFormUpdate } from '../api/permitForms.api';
import { createPermitForm, deletePermitForm, getPermitForm, listPermitForms, updatePermitForm } from '../api/permitForms.api';

export const permitFormsKeys = {
  all: ['permitForms'] as const,
  list: (search: string | undefined) => ['permitForms', 'list', search ?? ''] as const,
  detail: (id: string) => ['permitForms', 'detail', id] as const,
};

export function usePermitForms(search?: string) {
  return useQuery({
    queryKey: permitFormsKeys.list(search),
    queryFn: () => listPermitForms(search),
  });
}

export function usePermitForm(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? permitFormsKeys.detail(id) : ['permitForms', 'detail', 'disabled'],
    queryFn: () => getPermitForm(id!),
    enabled: !!id,
  });
}

export function useCreatePermitForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PermitFormInsert) => createPermitForm(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permitFormsKeys.all });
    },
  });
}

export function useUpdatePermitForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PermitFormUpdate }) =>
      updatePermitForm(id, updates),
    onSuccess: (data: PermitForm) => {
      queryClient.invalidateQueries({ queryKey: permitFormsKeys.all });
      queryClient.setQueryData(permitFormsKeys.detail(data.id), data);
    },
  });
}

export function useDeletePermitForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePermitForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permitFormsKeys.all });
    },
  });
}

