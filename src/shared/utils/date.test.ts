import { formatOrderDate } from './date';

/**
 * `formatOrderDate` lee componentes locales (`getDate`/`getHours`) -- se
 * construye el ISO desde una fecha local (no un literal UTC) para que el
 * test no dependa del timezone de la máquina que corre Jest.
 */
function isoFromLocal(year: number, month: number, day: number, hours: number, minutes: number) {
  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

describe('formatOrderDate', () => {
  it('formatea día, mes en español y hora:minuto con ceros a la izquierda', () => {
    expect(formatOrderDate(isoFromLocal(2026, 7, 24, 14, 5))).toBe('24 jul · 14:05');
  });

  it('usa la tabla de meses en español para cada mes del año', () => {
    expect(formatOrderDate(isoFromLocal(2026, 1, 1, 0, 0))).toBe('1 ene · 00:00');
    expect(formatOrderDate(isoFromLocal(2026, 12, 31, 9, 30))).toBe('31 dic · 09:30');
  });
});
