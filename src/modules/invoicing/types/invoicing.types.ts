export interface Invoice {
  id: string;
  order_id: string | null;
  invoice_number: string;
  customer_name: string;
  amount: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  issue_date: string;
  payment_method: string | null;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  /** Stripe Checkout Session ID from creation */
  stripe_checkout_session_id?: string | null;
  /** Stripe Payment Intent ID when payment completes */
  stripe_payment_intent_id?: string | null;
  /** Stripe lifecycle: unpaid | pending | paid */
  stripe_status?: 'unpaid' | 'pending' | 'paid' | null;
  /** When Stripe payment completed (webhook) */
  paid_at?: string | null;
}

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;
export type InvoiceUpdate = Partial<InvoiceInsert>;

