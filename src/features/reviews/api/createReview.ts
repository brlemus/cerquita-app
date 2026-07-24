import { request } from '@/shared/api';
import type { CreateReviewPayload, Review } from './types';

export async function createReview(orderId: string, payload: CreateReviewPayload): Promise<Review> {
  const data = await request<Review>(`/orders/${orderId}/reviews`, {
    method: 'POST',
    body: payload,
  });
  if (!data) {
    throw new Error('POST /orders/:id/reviews returned no body');
  }
  return data;
}
