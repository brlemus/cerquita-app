import Constants from 'expo-constants';

import { ApiRequestError, mapError } from './errors';

/**
 * Provee el JWT de Clerk. Sin configurar (Fase 0) siempre devuelve
 * `undefined` — la Fase 1 la cablea a `useAuth().getToken()`.
 */
type TokenProvider = () => Promise<string | null | undefined>;

let getAuthToken: TokenProvider = async () => undefined;

export function configureAuth(provider: TokenProvider): void {
  getAuthToken = provider;
}

function resolveBaseUrl(): string {
  const extra = Constants.expoConfig?.extra;
  const apiUrl = extra && typeof extra.apiUrl === 'string' ? extra.apiUrl : undefined;
  return apiUrl ?? 'http://localhost:3000';
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
};

/**
 * Única puerta al backend. Inyecta Authorization, mapea errores del
 * contrato y trata 304 (polling con ETag, Fase 5) como "sin cambios".
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T | undefined> {
  const { body, headers, ...rest } = options;
  const token = await getAuthToken();

  let response: Response;
  try {
    response = await fetch(`${resolveBaseUrl()}/api/v1${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ApiRequestError({
      kind: 'network',
      message: error instanceof Error ? error.message : 'Network request failed',
    });
  }

  if (response.status === 304) {
    return undefined;
  }

  const parsedBody = await parseBody(response);

  if (!response.ok) {
    throw new ApiRequestError(mapError(response.status, parsedBody));
  }

  return parsedBody as T;
}
