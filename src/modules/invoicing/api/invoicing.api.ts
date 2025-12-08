import { supabase } from '@/shared/lib/supabase';
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '../types/invoicing.types';

export async function fetchInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Invoice[];
}

export async function fetchInvoice(id: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Invoice;
}

export async function createInvoice(invoice: InvoiceInsert) {
  // Generate invoice number if not provided
  if (!invoice.invoice_number) {
    // Try to get next value from sequence via RPC
    // If RPC function doesn't exist, we'll use a fallback
    try {
      const { data: invoiceNumber, error: rpcError } = await supabase
        .rpc('get_next_invoice_number');
      
      if (!rpcError && invoiceNumber) {
        invoice.invoice_number = invoiceNumber;
      } else {
        // Fallback: Get max invoice number and increment
        const { data: maxInvoice, error: maxError } = await supabase
          .from('invoices')
          .select('invoice_number')
          .order('invoice_number', { ascending: false })
          .limit(1)
          .single();
        
        if (!maxError && maxInvoice?.invoice_number) {
          // Extract number from format like "INV-000001" or "1001"
          const match = maxInvoice.invoice_number.match(/\d+/);
          const nextNum = match ? parseInt(match[0], 10) + 1 : 1001;
          invoice.invoice_number = `INV-${String(nextNum).padStart(6, '0')}`;
        } else {
          // First invoice
          invoice.invoice_number = 'INV-000001';
        }
      }
    } catch {
      // Fallback: Use timestamp-based number for Phase 1
      const timestamp = Date.now();
      invoice.invoice_number = `INV-${String(timestamp).slice(-6)}`;
    }
  }
  
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single();
  
  if (error) throw error;
  return data as Invoice;
}

export async function updateInvoice(id: string, updates: InvoiceUpdate) {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Invoice;
}

export async function deleteInvoice(id: string) {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

