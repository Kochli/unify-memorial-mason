import { supabase } from '@/shared/lib/supabase';
import type { Order, OrderInsert, OrderUpdate } from '../types/orders.types';

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(id, first_name, last_name)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Order[];
}

export async function fetchOrder(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(id, first_name, last_name)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Order;
}

/**
 * Fetch all orders associated with a specific invoice
 * @param invoiceId - UUID of the invoice
 * @returns Array of Order objects ordered by creation date (newest first)
 */
export async function fetchOrdersByInvoice(invoiceId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(id, first_name, last_name)')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Order[];
}

export async function createOrder(order: OrderInsert) {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  
  if (error) throw error;
  return data as Order;
}

export async function updateOrder(id: string, updates: OrderUpdate) {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Order;
}

export async function deleteOrder(id: string) {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Fetch only person_id from an order (lightweight query)
 * @param orderId - UUID of the order
 * @returns person_id string or null
 */
export async function fetchOrderPersonId(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('person_id')
    .eq('id', orderId)
    .single();
  
  if (error) {
    // Handle gracefully - if order not found, return null
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  
  return data?.person_id as string | null;
}

/**
 * Fetch all person_id values from orders linked to an invoice
 * @param invoiceId - UUID of the invoice
 * @returns Array of unique non-null person_id strings
 */
export async function fetchInvoicePersonIds(invoiceId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('person_id')
    .eq('invoice_id', invoiceId);
  
  if (error) throw error;
  
  // Extract unique non-null person_ids
  const personIds = new Set<string>();
  data?.forEach(order => {
    if (order.person_id) {
      personIds.add(order.person_id);
    }
  });
  
  return Array.from(personIds);
}

