import { classifyOrderConflict, extractStockConflictLine } from './classifyOrderConflict';

describe('classifyOrderConflict', () => {
  it('sin details -> minOrderNotMet', () => {
    expect(classifyOrderConflict(undefined)).toBe('minOrderNotMet');
  });

  it('details con variantOptionId -> stockInsufficient', () => {
    expect(classifyOrderConflict({ variantOptionId: 'v1', quantity: 2 })).toBe('stockInsufficient');
  });

  it('details con productId (sin variantOptionId) -> stockInsufficient', () => {
    expect(classifyOrderConflict({ productId: 'p1', quantity: 1 })).toBe('stockInsufficient');
  });

  it('details con businessId + isOpen -> businessClosed', () => {
    expect(classifyOrderConflict({ businessId: 'b1', status: 'ACTIVE', isOpen: false })).toBe(
      'businessClosed',
    );
  });

  it('details con forma no reconocida -> unknown', () => {
    expect(classifyOrderConflict({ somethingElse: true })).toBe('unknown');
  });
});

describe('extractStockConflictLine', () => {
  it('devuelve variantOptionId cuando está presente', () => {
    expect(extractStockConflictLine({ variantOptionId: 'v1', quantity: 3 })).toEqual({
      variantOptionId: 'v1',
    });
  });

  it('devuelve productId cuando no hay variantOptionId', () => {
    expect(extractStockConflictLine({ productId: 'p1', quantity: 3 })).toEqual({ productId: 'p1' });
  });

  it('devuelve undefined si details no tiene ninguno de los dos campos', () => {
    expect(extractStockConflictLine({ quantity: 3 })).toBeUndefined();
  });

  it('devuelve undefined si details es undefined', () => {
    expect(extractStockConflictLine(undefined)).toBeUndefined();
  });
});
