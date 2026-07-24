import { useQuery } from '@tanstack/react-query';

import { getOrderById } from '../api/getOrderById';

export const ORDER_DETAIL_QUERY_KEY = (orderId: string) => ['orders', 'detail', orderId] as const;

/** Pedido completo, una sola vez (no reactivo al polling -- ver useOrderStatus). */
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ORDER_DETAIL_QUERY_KEY(orderId),
    queryFn: () => getOrderById(orderId),
  });
}
