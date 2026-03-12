-- Fix invoices_with_breakdown to use the real invoice→order relationship.
-- Source of truth: public.orders.invoice_id references public.invoices.id
-- Aggregate across all orders linked to an invoice.

drop view if exists public.invoices_with_breakdown;

create view public.invoices_with_breakdown as
select
  i.*,
  b.main_product_total,
  b.permit_total_cost,
  b.additional_options_total
from public.invoices i
left join lateral (
  select
    sum(
      case
        when owt.order_type = 'Renovation' then coalesce(owt.renovation_service_cost, 0)
        else coalesce(owt.value, 0)
      end
    )::numeric as main_product_total,
    sum(coalesce(owt.permit_cost, 0))::numeric as permit_total_cost,
    sum(coalesce(owt.additional_options_total, 0))::numeric as additional_options_total
  from public.orders_with_options_total owt
  where owt.invoice_id = i.id
) b on true;

comment on view public.invoices_with_breakdown is
  'Invoices list view including order-derived breakdown totals aggregated from orders_with_options_total via orders.invoice_id.';

