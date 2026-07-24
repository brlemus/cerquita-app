const MONTHS_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/**
 * Formatea un ISO string del backend a "24 jul · 14:30" -- meses en español
 * vía tabla propia en vez de `Intl`, cuyo soporte de locale completo en
 * Hermes no está garantizado en todos los builds.
 */
export function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  const day = date.getDate();
  const month = MONTHS_ES[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} · ${hours}:${minutes}`;
}
