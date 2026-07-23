import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { getOrderStatus } from '../api/getOrderStatus';
import type { OrderStatusPoll } from '../api/types';
import { isTerminalStatus } from '../utils/orderStatus';

const POLL_INTERVAL_MS = 5000;

export const ORDER_STATUS_QUERY_KEY = (orderId: string) => ['orders', 'status', orderId] as const;

/** 12 req/min, 60% de margen bajo el límite propio de 30/min del endpoint. */
export function getPollInterval(status: OrderStatusPoll['status'] | undefined): number | false {
  return status && isTerminalStatus(status) ? false : POLL_INTERVAL_MS;
}

/**
 * Polling liviano de `GET /orders/:id/status` -- separado de `useOrder`
 * para no repetir items/totales en cada tick. `focusManager` (ver
 * shared/api/queryFocusManager.ts) ya pausa el refetch en background;
 * `refetchInterval` se detiene solo en estados terminales.
 */
export function useOrderStatus(orderId: string) {
  const etagRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const queryKey = ORDER_STATUS_QUERY_KEY(orderId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data, etag } = await getOrderStatus(orderId, etagRef.current);
      etagRef.current = etag;
      // 304: sin cambios -- nunca se pisa el último valor conocido con null.
      return data ?? queryClient.getQueryData<OrderStatusPoll>(queryKey) ?? null;
    },
    refetchInterval: (query) => getPollInterval(query.state.data?.status),
    // Un 429/error puntual se resuelve solo en el próximo tick -- reintentar
    // automático empeoraría el rate limit propio del endpoint (30/min).
    retry: false,
  });
}
