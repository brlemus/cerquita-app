import { classifyOrderConflict, extractConflictLine } from './classifyOrderConflict';

describe('classifyOrderConflict', () => {
  describe('vía details.reason', () => {
    it('BUSINESS_NOT_ACCEPTING_ORDERS -> businessClosed', () => {
      expect(
        classifyOrderConflict({ reason: 'BUSINESS_NOT_ACCEPTING_ORDERS', businessId: 'b1' }),
      ).toBe('businessClosed');
    });

    it('BELOW_MINIMUM_ORDER -> minOrderNotMet (aunque venga con details)', () => {
      expect(
        classifyOrderConflict({
          reason: 'BELOW_MINIMUM_ORDER',
          subtotalCents: 650,
          minOrderCents: 800,
        }),
      ).toBe('minOrderNotMet');
    });

    it('PRODUCT_NOT_ACTIVE -> productInactive', () => {
      expect(classifyOrderConflict({ reason: 'PRODUCT_NOT_ACTIVE', productId: 'p1' })).toBe(
        'productInactive',
      );
    });

    it('VARIANT_OPTION_NOT_ACTIVE -> productInactive', () => {
      expect(
        classifyOrderConflict({ reason: 'VARIANT_OPTION_NOT_ACTIVE', variantOptionId: 'v1' }),
      ).toBe('productInactive');
    });

    it('INSUFFICIENT_STOCK -> stockInsufficient', () => {
      expect(
        classifyOrderConflict({ reason: 'INSUFFICIENT_STOCK', productId: 'p1', quantity: 2 }),
      ).toBe('stockInsufficient');
    });

    it('reason fuera del catálogo de checkout (ej. de cancelación) -> unknown', () => {
      expect(classifyOrderConflict({ reason: 'STATUS_CHANGED_CONCURRENTLY' })).toBe('unknown');
    });
  });

  describe('fallback legacy (sin reason -- backend desactualizado)', () => {
    it('sin details -> minOrderNotMet', () => {
      expect(classifyOrderConflict(undefined)).toBe('minOrderNotMet');
    });

    it('details con variantOptionId -> stockInsufficient', () => {
      expect(classifyOrderConflict({ variantOptionId: 'v1', quantity: 2 })).toBe(
        'stockInsufficient',
      );
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
});

describe('extractConflictLine', () => {
  it('devuelve variantOptionId cuando está presente', () => {
    expect(extractConflictLine({ variantOptionId: 'v1', quantity: 3 })).toEqual({
      variantOptionId: 'v1',
    });
  });

  it('devuelve productId cuando no hay variantOptionId', () => {
    expect(extractConflictLine({ productId: 'p1', quantity: 3 })).toEqual({ productId: 'p1' });
  });

  it('devuelve undefined si details no tiene ninguno de los dos campos', () => {
    expect(extractConflictLine({ quantity: 3 })).toBeUndefined();
  });

  it('devuelve undefined si details es undefined', () => {
    expect(extractConflictLine(undefined)).toBeUndefined();
  });
});
