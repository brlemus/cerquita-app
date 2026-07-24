import { request } from '@/shared/api';
import type { CreateFeedbackPayload, Feedback } from './types';

export async function submitFeedback(payload: CreateFeedbackPayload): Promise<Feedback> {
  const data = await request<Feedback>('/feedback', {
    method: 'POST',
    body: payload,
  });
  if (!data) {
    throw new Error('POST /feedback returned no body');
  }
  return data;
}
