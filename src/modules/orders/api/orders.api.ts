import { supabase } from '@/shared/lib/supabase';
import type { Order, OrderInsert, OrderUpdate, OrderAdditionalOption, OrderPerson } from '../types/orders.types';
import { normalizeOrder } from '../utils/numberParsing';

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders_with_options_total')
    .select('*, customers(id, first_name, last_name)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(normalizeOrder);
}

export async function fetchOrder(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(id, first_name, last_name), order_additional_options(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  // Calculate additional_options_total from joined options (single-order fetch uses orders table, not the view)
  if (data) {
    const normalizedOrder = normalizeOrder(data);
    if (normalizedOrder.order_additional_options && normalizedOrder.order_additional_options.length > 0) {
      const optionsTotal = normalizedOrder.order_additional_options.reduce((sum, opt) => {
        const cost = typeof opt.cost === 'string' ? parseFloat(opt.cost) : (opt.cost ?? 0);
        return sum + (Number.isFinite(cost) ? cost : 0);
      }, 0);
      normalizedOrder.additional_options_total = Number.isFinite(optionsTotal) ? optionsTotal : 0;
    } else {
      normalizedOrder.additional_options_total = 0;
    }
    return normalizedOrder;
  }
  throw new Error('Order not found');
}

/**
 * Fetch order_people for an order (people linked to order, with one primary)
 * @param orderId - UUID of the order
 * @returns Array of OrderPerson objects (primary first)
 */
export async function fetchOrderPeople(orderId: string): Promise<OrderPerson[]> {
  const { data, error } = await supabase
    .from('order_people')
    .select('id, order_id, person_id, is_primary, created_at, customers(id, first_name, last_name, email, phone)')
    .eq('order_id', orderId)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return (data || []) as OrderPerson[];
}

/**
 * Upsert order_people for an order; mirror primary to orders.person_id and orders.person_name
 * @param orderId - UUID of the order
 * @param people - Array of { person_id, is_primary }; exactly one must be primary (first used if none)
 */
export async function upsertOrderPeople(
  orderId: string,
  people: { person_id: string; is_primary: boolean }[]
): Promise<void> {
  if (people.length === 0) {
    const { error: delErr } = await supabase.from('order_people').delete().eq('order_id', orderId);
    if (delErr) throw delErr;
    const { error: updErr } = await supabase
      .from('orders')
      .update({ person_id: null, person_name: null })
      .eq('id', orderId);
    if (updErr) throw updErr;
    return;
  }

  // Enforce exactly one primary
  const hasPrimary = people.some((p) => p.is_primary);
  const normalized = hasPrimary
    ? people
    : people.map((p, i) => ({ ...p, is_primary: i === 0 }));

  // Delete existing, insert new (simpler than diff/upsert)
  const { error: delErr } = await supabase.from('order_people').delete().eq('order_id', orderId);
  if (delErr) throw delErr;

  const rows = normalized.map((p) => ({
    order_id: orderId,
    person_id: p.person_id,
    is_primary: p.is_primary,
  }));

  const { error: insErr } = await supabase.from('order_people').insert(rows);
  if (insErr) throw insErr;

  // Mirror primary to orders
  const primary = normalized.find((p) => p.is_primary);
  if (primary) {
    const { data: customer } = await supabase
      .from('customers')
      .select('id, first_name, last_name')
      .eq('id', primary.person_id)
      .single();

    const personName = customer
      ? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim() || null
      : null;

    const { error: updErr } = await supabase
      .from('orders')
      .update({ person_id: primary.person_id, person_name: personName })
      .eq('id', orderId);
    if (updErr) throw updErr;
  }
}

/**
 * Fetch all orders for a person (customer)
 * @param personId - UUID of the customer (person)
 * @returns Array of Order objects ordered by creation date (newest first)
 */
export async function fetchOrdersByPersonId(personId: string) {
  const { data, error } = await supabase
    .from('orders_with_options_total')
    .select('*, customers(id, first_name, last_name)')
    .eq('person_id', personId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeOrder);
}

/**
 * Fetch all orders associated with a specific invoice (includes additional_options for cost breakdown)
 * @param invoiceId - UUID of the invoice
 * @returns Array of Order objects ordered by creation date (newest first)
 */
export async function fetchOrdersByInvoice(invoiceId: string) {
  const { data, error } = await supabase
    .from('orders_with_options_total')
    .select('*, customers(id, first_name, last_name), order_additional_options(id, order_id, name, description, cost, created_at, updated_at)')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map((row: Record<string, unknown>) => {
    const normalized = normalizeOrder(row);
    const opts = row.order_additional_options as Array<{ id: string; order_id: string; name: string; description: string | null; cost: number; created_at: string; updated_at: string }> | undefined;
    const additional_options = Array.isArray(opts)
      ? opts.map((o) => ({
          ...o,
          cost: typeof o.cost === 'string' ? parseFloat(o.cost) : (o.cost ?? 0),
        }))
      : undefined;
    return { ...normalized, ...(additional_options && { additional_options }) } as Order;
  });
}

export async function createOrder(order: OrderInsert) {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select('*')
    .single();
  
  if (error) throw error;
  return normalizeOrder(data);
}

export async function updateOrder(id: string, updates: OrderUpdate) {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return normalizeOrder(data);
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

// ============================================================================
// Additional Options CRUD Functions
// ============================================================================

/**
 * Fetch all additional options for a specific order
 * @param orderId - UUID of the order
 * @returns Array of OrderAdditionalOption objects
 */
export async function fetchAdditionalOptionsByOrder(orderId: string) {
  const { data, error } = await supabase
    .from('order_additional_options')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data as OrderAdditionalOption[];
}

/**
 * Create a new additional option for an order
 * @param option - Additional option data (order_id, name, cost, description?)
 * @returns Created OrderAdditionalOption
 */
export async function createAdditionalOption(option: {
  order_id: string;
  name: string;
  cost: number;
  description?: string | null;
}) {
  const { data, error } = await supabase
    .from('order_additional_options')
    .insert(option)
    .select()
    .single();
  
  if (error) throw error;
  return data as OrderAdditionalOption;
}

/**
 * Update an existing additional option
 * @param id - UUID of the additional option
 * @param updates - Partial update data (name?, cost?, description?)
 * @returns Updated OrderAdditionalOption
 */
export async function updateAdditionalOption(
  id: string,
  updates: {
    name?: string;
    cost?: number;
    description?: string | null;
  }
) {
  const { data, error } = await supabase
    .from('order_additional_options')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as OrderAdditionalOption;
}

/**
 * Delete an additional option
 * @param id - UUID of the additional option
 * @returns The order_id of the deleted option (for cache invalidation)
 */
export async function deleteAdditionalOption(id: string) {
  // First fetch the option to get order_id for cache invalidation
  const { data: option, error: fetchError } = await supabase
    .from('order_additional_options')
    .select('order_id')
    .eq('id', id)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Then delete the option
  const { error } = await supabase
    .from('order_additional_options')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  
  // Return order_id for cache invalidation
  return option.order_id;
}

