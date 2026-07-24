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
 * Fetch interno compartido -- única puerta real al backend. Inyecta
 * Authorization y devuelve la `Response` cruda junto al body ya
 * parseado, para que un caller que necesite headers de la respuesta
 * (ETag del polling, Fase 5) no tenga que hacer un fetch suelto propio.
 */
export async function requestRaw(
  path: string,
  options: RequestOptions = {},
): Promise<{ response: Response; body: unknown }> {
  const { body, headers, ...rest } = options;

  // getAuthToken() (getToken() de Clerk) puede rechazar si la sesión se
  // cierra mientras este request está en vuelo (ej. logout con un poll
  // activo) -- se trata como "sin token" en vez de dejar el rechazo
  // propagar sin atrapar fuera de esta función.
  let token: string | null | undefined;
  try {
    token = await getAuthToken();
  } catch (error) {
    if (__DEV__) {
      console.log('[api] getAuthToken falló, se continúa sin token:', error);
    }
    token = null;
  }

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

  const parsedBody = response.status === 304 ? undefined : await parseBody(response);
  return { response, body: parsedBody };
}

/**
 * Única puerta al backend para el caso común. Mapea errores del
 * contrato y trata 304 (polling con ETag, Fase 5) como "sin cambios".
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T | undefined> {
  const { response, body } = await requestRaw(path, options);

  if (response.status === 304) {
    return undefined;
  }

  if (!response.ok) {
    throw new ApiRequestError(mapError(response.status, body));
  }

  return body as T;
}
