import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Order } from '@/modules/orders/types/orders.types';

export const mapOrdersKeys = {
  all: ['map', 'orders'] as const,
};

async function fetchOrdersForMap(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Order[];
}

export function useOrdersForMap() {
  return useQuery({
    queryKey: mapOrdersKeys.all,
    queryFn: fetchOrdersForMap,
  });
}

