import { ApiRequestError } from '@/shared/api';

const RETRYABLE_KINDS = new Set(['network', 'server', 'rateLimited']);

/**
 * Los errores de cuenta del contrato (401/403/409) son determinísticos —
 * reintentarlos solo repite el mismo resultado. Solo vale la pena reintentar
 * fallas transitorias (red, 5xx, rate limit).
 */
export function shouldRetryAuthMe(failureCount: number, error: unknown): boolean {
  const kind = error instanceof ApiRequestError ? error.error.kind : 'unknown';
  return RETRYABLE_KINDS.has(kind) && failureCount < 2;
}
