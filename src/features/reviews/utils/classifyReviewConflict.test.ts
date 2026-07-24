import { classifyReviewConflict } from './classifyReviewConflict';

describe('classifyReviewConflict', () => {
  describe('vía details.reason', () => {
    it('REVIEW_ALREADY_EXISTS -> alreadyReviewed', () => {
      expect(classifyReviewConflict({ reason: 'REVIEW_ALREADY_EXISTS', orderId: 'o1' })).toBe(
        'alreadyReviewed',
      );
    });

    it('ORDER_NOT_DELIVERED -> orderNotDelivered', () => {
      expect(
        classifyReviewConflict({
          reason: 'ORDER_NOT_DELIVERED',
          orderId: 'o1',
          status: 'PENDIENTE',
        }),
      ).toBe('orderNotDelivered');
    });

    it('reason fuera del catálogo de reseñas (ej. de checkout) -> unknown', () => {
      expect(classifyReviewConflict({ reason: 'BELOW_MINIMUM_ORDER' })).toBe('unknown');
    });
  });

  describe('fallback legacy (sin reason -- backend desactualizado)', () => {
    it('sin details -> alreadyReviewed (preserva el comportamiento histórico)', () => {
      expect(classifyReviewConflict(undefined)).toBe('alreadyReviewed');
    });

    it('details sin reason reconocido -> alreadyReviewed', () => {
      expect(classifyReviewConflict({ orderId: 'o1' })).toBe('alreadyReviewed');
    });
  });
});
