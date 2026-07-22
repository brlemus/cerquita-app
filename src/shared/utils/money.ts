/**
 * El backend siempre manda centavos enteros (docs/API_CONTRACT.md). Este
 * formateo es solo de presentación — nunca se hace el cálculo inverso.
 */
export function formatMoneyCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
