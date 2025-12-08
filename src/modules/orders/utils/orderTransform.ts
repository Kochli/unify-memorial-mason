import type { Order } from '../types/orders.types';

// UI-friendly order format (for display in tables/sidebars)
export interface UIOrder {
  id: string;
  customer: string;
  type: string;
  stoneStatus: string;
  permitStatus: string;
  proofStatus: string;
  dueDate: string;
  depositDate: string;
  secondPaymentDate: string | null;
  installationDate: string | null;
  value: string; // Formatted currency string
  location: string;
  progress: number;
  assignedTo: string;
  priority: string;
  sku: string;
  material: string;
  color: string;
  timelineWeeks: number;
  customerEmail?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
}

/**
 * Transform database order to UI-friendly format
 */
export function transformOrderForUI(order: Order): UIOrder {
  return {
    id: order.id,
    customer: order.customer_name,
    type: order.order_type,
    stoneStatus: order.stone_status,
    permitStatus: order.permit_status,
    proofStatus: order.proof_status,
    dueDate: order.due_date || '',
    depositDate: order.deposit_date || '',
    secondPaymentDate: order.second_payment_date || null,
    installationDate: order.installation_date || null,
    value: order.value ? `£${order.value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A',
    location: order.location || '',
    progress: order.progress,
    assignedTo: order.assigned_to || '',
    priority: order.priority,
    sku: order.sku || '',
    material: order.material || '',
    color: order.color || '',
    timelineWeeks: order.timeline_weeks,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    notes: order.notes,
  };
}

/**
 * Transform array of database orders to UI format
 */
export function transformOrdersForUI(orders: Order[]): UIOrder[] {
  return orders.map(transformOrderForUI);
}

