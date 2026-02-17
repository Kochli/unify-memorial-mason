import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Package } from 'lucide-react';
import { useOrdersByPersonId, useOrder, ordersKeys } from '@/modules/orders/hooks/useOrders';
import { OrderDetailsSidebar } from '@/modules/orders/components/OrderDetailsSidebar';
import { getOrderDisplayId } from '@/modules/orders/utils/orderDisplayId';
import { getOrderTotalFormatted } from '@/modules/orders/utils/orderCalculations';
import type { Order } from '@/modules/orders/types/orders.types';
import { useQueryClient } from '@tanstack/react-query';

interface PersonOrdersPanelProps {
  personId: string | null;
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  onCloseOrder: () => void;
}

export const PersonOrdersPanel: React.FC<PersonOrdersPanelProps> = ({
  personId,
  selectedOrderId,
  onSelectOrder,
  onCloseOrder,
}) => {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading, error } = useOrdersByPersonId(personId);
  const { data: selectedOrder } = useOrder(selectedOrderId ?? '');
  const autoSelectedPersonRef = useRef<string | null>(null);

  // Auto-select the first order when orders load for a new person
  useEffect(() => {
    if (
      !isLoading &&
      orders.length > 0 &&
      personId &&
      autoSelectedPersonRef.current !== personId
    ) {
      autoSelectedPersonRef.current = personId;
      onSelectOrder(orders[0].id);
    }
  }, [isLoading, orders, personId, onSelectOrder]);

  if (!personId) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="text-center text-slate-500 text-sm">
            Select a person to view orders
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleOrderUpdate = (orderId: string, _updates: Partial<Order>) => {
    queryClient.invalidateQueries({ queryKey: ordersKeys.byPerson(personId) });
  };

  return (
    <Card>
      <CardHeader className="pb-1.5 pt-2 px-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" />
          Orders {orders.length > 0 && `(${orders.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3 pt-2">
        {isLoading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed to load orders'}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-3">
            No orders for this person yet
          </div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onSelectOrder(order.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors ${
                  selectedOrderId === order.id ? 'bg-slate-100 ring-1 ring-slate-300' : ''
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-medium text-sm">
                    {getOrderDisplayId(order)}
                  </span>
                  <span className="text-sm text-slate-600">
                    {getOrderTotalFormatted(order)}
                  </span>
                </div>
                <div className="flex gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-500">
                    {order.order_type}
                  </span>
                  {order.due_date && (
                    <span className="text-xs text-slate-500">
                      Due {new Date(order.due_date).toLocaleDateString('en-GB')}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedOrderId && selectedOrder && (
          <div className="mt-3 border-t pt-3 max-h-[400px] overflow-y-auto">
            <OrderDetailsSidebar
              order={selectedOrder}
              onClose={onCloseOrder}
              onOrderUpdate={handleOrderUpdate}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
