/**
 * Mapeo centralizado del contrato de errores (docs/API_CONTRACT.md).
 * `kind` es lo que cada pantalla debe consumir para decidir su UI — nunca
 * el status HTTP crudo.
 */
export type ApiError =
  | { kind: 'unauthorized'; status: 401; message: string }
  | { kind: 'suspended'; status: 403; message: string }
  | { kind: 'forbidden'; status: 403; message: string }
  | {
      kind: 'reRegisterBlocked';
      status: 409;
      message: string;
      details?: Record<string, unknown>;
    }
  | {
      kind: 'conflict';
      status: 409;
      code?: string;
      message: string;
      details?: Record<string, unknown>;
    }
  | { kind: 'notFound'; status: 404; message: string }
  | { kind: 'validation'; status: 400; message: string | string[] }
  | { kind: 'rateLimited'; status: 429; message: string }
  | { kind: 'server'; status: number; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'unknown'; status: number; message: string };

export class ApiRequestError extends Error {
  readonly error: ApiError;

  constructor(error: ApiError) {
    super(Array.isArray(error.message) ? error.message.join(', ') : error.message);
    this.name = 'ApiRequestError';
    this.error = error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractMessage(body: unknown, fallback: string): string {
  if (isRecord(body) && typeof body.message === 'string') {
    return body.message;
  }
  return fallback;
}

function extractRawMessage(body: unknown): string | string[] | undefined {
  if (!isRecord(body)) {
    return undefined;
  }
  if (typeof body.message === 'string' || Array.isArray(body.message)) {
    return body.message as string | string[];
  }
  return undefined;
}

function extractCode(body: unknown): string | undefined {
  return isRecord(body) && typeof body.code === 'string' ? body.code : undefined;
}

function extractDetails(body: unknown): Record<string, unknown> | undefined {
  return isRecord(body) && isRecord(body.details) ? body.details : undefined;
}

/** Mensajes del flujo de re-registro rechazado (docs/API_CONTRACT.md, sección Auth). */
const RE_REGISTER_BLOCKED_PATTERN = /cannot re-register|already exists/i;

export function mapError(status: number, body: unknown): ApiError {
  const message = extractMessage(body, 'Unexpected error');

  switch (status) {
    case 401:
      return { kind: 'unauthorized', status, message };
    case 403:
      return message.toLowerCase() === 'user is suspended'
        ? { kind: 'suspended', status, message }
        : { kind: 'forbidden', status, message };
    case 404:
      return { kind: 'notFound', status, message };
    case 409: {
      const details = extractDetails(body);
      if (RE_REGISTER_BLOCKED_PATTERN.test(message)) {
        return { kind: 'reRegisterBlocked', status, message, details };
      }
      return { kind: 'conflict', status, code: extractCode(body), message, details };
    }
    case 400:
      return { kind: 'validation', status, message: extractRawMessage(body) ?? message };
    case 429:
      return { kind: 'rateLimited', status, message };
    default:
      return status >= 500
        ? { kind: 'server', status, message }
        : { kind: 'unknown', status, message };
  }
}
