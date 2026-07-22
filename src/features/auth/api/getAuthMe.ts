import { request, type AuthMeResponse } from '@/shared/api';

export async function getAuthMe(): Promise<AuthMeResponse> {
  const data = await request<AuthMeResponse>('/auth/me');
  if (!data) {
    throw new Error('GET /auth/me returned no body');
  }
  return data;
}
