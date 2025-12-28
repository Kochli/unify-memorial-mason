import type { Invoice } from '../types/invoicing.types';

// UI-friendly invoice format (for display in tables)
export interface UIInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string | null;
  customer: string;
  amount: string; // Formatted currency string
  status: string; // May be 'overdue' if pending and past due
  dueDate: string;
  issueDate: string;
  paymentMethod: string | null;
  paymentDate: string | null;
  notes: string | null;
  daysOverdue: number; // Calculated field
}

/**
 * Transform database invoice to UI-friendly format
 */
export function transformInvoiceForUI(invoice: Invoice): UIInvoice {
  const today = new Date();
  const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
  const daysOverdue = dueDate && dueDate < today 
    ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Calculate display status: if pending and overdue, show as overdue
  const displayStatus = invoice.status === 'pending' && daysOverdue > 0 
    ? 'overdue' 
    : invoice.status;

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    orderId: invoice.order_id,
    customer: invoice.customer_name || 'No person assigned',
    amount: `$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    status: displayStatus,
    dueDate: invoice.due_date,
    issueDate: invoice.issue_date,
    paymentMethod: invoice.payment_method,
    paymentDate: invoice.payment_date,
    notes: invoice.notes,
    daysOverdue,
  };
}

/**
 * Transform array of database invoices to UI format
 */
export function transformInvoicesForUI(invoices: Invoice[]): UIInvoice[] {
  return invoices.map(transformInvoiceForUI);
}

