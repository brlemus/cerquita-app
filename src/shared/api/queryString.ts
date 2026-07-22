export type QueryParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Arma un query string a partir de un objeto plano, omitiendo `undefined`/
 * `null`/`''`. Primer helper de GET-con-query-params de la app — la
 * paginación por cursor del contrato lo necesita en cualquier feature con
 * listas (`docs/API_CONTRACT.md`).
 */
export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    searchParams.append(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
