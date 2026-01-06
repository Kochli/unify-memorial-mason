import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOrders, fetchOrder, fetchOrdersByInvoice, createOrder, updateOrder, deleteOrder, fetchOrderPersonId, fetchInvoicePersonIds } from '../api/orders.api';
import type { OrderInsert, OrderUpdate } from '../types/orders.types';

export const ordersKeys = {
  all: ['orders'] as const,
  detail: (id: string) => ['orders', id] as const,
  byInvoice: (invoiceId: string) => ['orders', 'byInvoice', invoiceId] as const,
  personId: (orderId: string) => ['orders', 'personId', orderId] as const,
  personIdsByInvoice: (invoiceId: string) => ['orders', 'personIdsByInvoice', invoiceId] as const,
};

export function useOrdersList() {
  return useQuery({
    queryKey: ordersKeys.all,
    queryFn: fetchOrders,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ordersKeys.detail(id),
    queryFn: () => fetchOrder(id),
    enabled: !!id,
  });
}

/**
 * React Query hook to fetch orders by invoice ID
 * @param invoiceId - UUID of the invoice (hook is disabled if invoiceId is falsy)
 * @returns React Query result with orders array
 */
export function useOrdersByInvoice(invoiceId: string | null | undefined) {
  return useQuery({
    queryKey: invoiceId ? ordersKeys.byInvoice(invoiceId) : ['orders', 'byInvoice', 'disabled'],
    queryFn: () => fetchOrdersByInvoice(invoiceId!),
    enabled: !!invoiceId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (order: OrderInsert) => createOrder(order),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      // If order has invoice_id, invalidate byInvoice query
      if (data.invoice_id) {
        queryClient.invalidateQueries({ 
          queryKey: ordersKeys.byInvoice(data.invoice_id) 
        });
      }
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: OrderUpdate }) => 
      updateOrder(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      queryClient.setQueryData(ordersKeys.detail(data.id), data);
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

/**
 * React Query hook to fetch only person_id from an order (lightweight query)
 * @param orderId - UUID of the order (hook is disabled if orderId is falsy)
 * @param options - Optional configuration including enabled flag
 * @returns React Query result with person_id string or null
 */
export function useOrderPersonId(
  orderId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: orderId ? ordersKeys.personId(orderId) : ['orders', 'personId', 'disabled'],
    queryFn: () => fetchOrderPersonId(orderId!),
    enabled: (options?.enabled ?? true) && !!orderId,
  });
}

/**
 * React Query hook to fetch all person_id values from orders linked to an invoice
 * @param invoiceId - UUID of the invoice (hook is disabled if invoiceId is falsy)
 * @param options - Optional configuration including enabled flag
 * @returns React Query result with array of unique person_id strings
 */
export function useInvoicePersonIds(
  invoiceId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: invoiceId ? ordersKeys.personIdsByInvoice(invoiceId) : ['orders', 'personIdsByInvoice', 'disabled'],
    queryFn: () => fetchInvoicePersonIds(invoiceId!),
    enabled: (options?.enabled ?? true) && !!invoiceId,
  });
}

