import { useMutation } from '@tanstack/react-query';

import { createOrder } from '../api/createOrder';
import type { CreateOrderPayload } from '../api/types';

export function useCreateOrder() {
  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: CreateOrderPayload;
      idempotencyKey: string;
    }) => createOrder(payload, idempotencyKey),
  });
}
