-- Create read-only view for invoice list breakdown columns.
-- Adds: main_product_total, additional_options_total, permit_total_cost (all numeric).
-- Non-destructive: additive view only.

drop view if exists public.invoices_with_breakdown;

create view public.invoices_with_breakdown as
select
  i.*,
  case
    when i.order_id is null then null
    else coalesce(
      case
        when o.order_type = 'Renovation' then o.renovation_service_cost
        else o.value
      end,
      0
    )
  end::numeric as main_product_total,
  case
    when i.order_id is null then null
    else coalesce(o.permit_cost, 0)
  end::numeric as permit_total_cost,
  case
    when i.order_id is null then null
    else coalesce(owt.additional_options_total, 0)
  end::numeric as additional_options_total
from public.invoices i
left join public.orders o
  on o.id = i.order_id
left join public.orders_with_options_total owt
  on owt.id = o.id;

comment on view public.invoices_with_breakdown is
  'Invoices list view including order-derived breakdown totals: main product, permit, and additional options.';

