-- Update orders_with_options_total view to expose person_id for Inbox Orders tab
-- This view remains based on public.orders, which already has person_id referencing customers.
-- We select o.* (including person_id) plus aggregated additional_options_total.

drop view if exists public.orders_with_options_total;

create view public.orders_with_options_total as
select
  o.*,
  coalesce(sum(ao.cost), 0)::numeric as additional_options_total
from public.orders o
left join public.order_additional_options ao
  on ao.order_id = o.id
group by o.id;

comment on view public.orders_with_options_total is
  'View of orders with pre-calculated additional_options_total to avoid N+1 queries. Includes all order columns including person_id, product_photo_url, renovation fields, and order_number.';

