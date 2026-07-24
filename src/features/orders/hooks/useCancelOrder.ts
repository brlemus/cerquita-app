import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiRequestError } from '@/shared/api';
import { cancelOrder } from '../api/cancelOrder';
import { ORDER_DETAIL_QUERY_KEY } from './useOrder';
import { ORDER_STATUS_QUERY_KEY } from './useOrderStatus';

/**
 * `POST /orders/:id/cancel`. En éxito, la respuesta YA es el pedido
 * actualizado -- se escribe directo al cache, sin refetch. En 409
 * (carrera: el negocio ya lo movió a `PREPARANDO`) se invalida en vez de
 * asumir nada -- recarga el estado real (docs/API_CONTRACT.md, regla de
 * transiciones concurrentes).
 */
export function useCancelOrder(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: (order) => {
      queryClient.setQueryData(ORDER_DETAIL_QUERY_KEY(orderId), order);
      queryClient.invalidateQueries({ queryKey: ORDER_STATUS_QUERY_KEY(orderId) });
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.error.kind === 'conflict') {
        queryClient.invalidateQueries({ queryKey: ORDER_DETAIL_QUERY_KEY(orderId) });
        queryClient.invalidateQueries({ queryKey: ORDER_STATUS_QUERY_KEY(orderId) });
      }
    },
  });
}
