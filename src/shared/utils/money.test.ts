import { formatMoneyCents } from './money';

describe('formatMoneyCents', () => {
  it('formatea centavos exactos', () => {
    expect(formatMoneyCents(65)).toBe('$0.65');
  });

  it('formatea montos con dólares y centavos', () => {
    expect(formatMoneyCents(130)).toBe('$1.30');
  });

  it('formatea cero', () => {
    expect(formatMoneyCents(0)).toBe('$0.00');
  });

  it('redondea a dos decimales', () => {
    expect(formatMoneyCents(100)).toBe('$1.00');
  });

  it('formatea montos grandes con miles', () => {
    expect(formatMoneyCents(123456)).toBe('$1234.56');
  });
});
