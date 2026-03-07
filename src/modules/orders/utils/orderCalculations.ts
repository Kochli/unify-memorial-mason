import type { Order } from '../types/orders.types';

/**
 * Check if an order is a Renovation order type
 * Uses the exact string value from the schema enum: 'Renovation'
 */
export function isRenovationOrder(order: Order): boolean {
  return order.order_type === 'Renovation';
}

/**
 * Get the base order value (null/NaN treated as 0)
 * - Renovation orders: uses renovation_service_cost as base value
 * - New Memorial orders: uses value field (product-driven)
 */
export function getOrderBaseValue(order: Order): number {
  const raw = isRenovationOrder(order)
    ? (order.renovation_service_cost ?? 0)
    : (order.value ?? 0);
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Get the permit cost (null/NaN treated as 0)
 */
export function getOrderPermitCost(order: Order): number {
  const raw = order.permit_cost ?? 0;
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Get the additional options total (null/undefined/string/NaN treated as 0)
 * This value comes from the orders_with_options_total view (or from joined options in single-order fetch)
 */
export function getOrderAdditionalOptionsTotal(order: Order): number {
  const v = order.additional_options_total ?? 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Calculate the total order value (base value + permit cost + additional options total)
 * All null/undefined values are treated as 0; NaN-safe.
 */
export function getOrderTotal(order: Order): number {
  const baseValue = getOrderBaseValue(order);
  const permitCost = getOrderPermitCost(order);
  const optionsTotal = getOrderAdditionalOptionsTotal(order);
  const total = baseValue + permitCost + optionsTotal;
  return Number.isFinite(total) ? total : 0;
}

/**
 * Format the order total as GBP currency string (en-GB locale)
 */
export function getOrderTotalFormatted(order: Order): string {
  const total = getOrderTotal(order);
  return `£${total.toLocaleString('en-GB', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

