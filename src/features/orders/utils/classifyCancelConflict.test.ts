import { classifyCancelConflict } from './classifyCancelConflict';

describe('classifyCancelConflict', () => {
  describe('vía details.reason', () => {
    it('STATUS_CHANGED_CONCURRENTLY -> statusChanged', () => {
      expect(
        classifyCancelConflict({
          reason: 'STATUS_CHANGED_CONCURRENTLY',
          orderId: 'o1',
          from: 'PENDIENTE',
          to: 'CANCELADO',
        }),
      ).toBe('statusChanged');
    });

    it('INVALID_STATUS_TRANSITION con from ENTREGADO -> alreadyDelivered', () => {
      expect(
        classifyCancelConflict({
          reason: 'INVALID_STATUS_TRANSITION',
          from: 'ENTREGADO',
          to: 'CANCELADO',
        }),
      ).toBe('alreadyDelivered');
    });

    it('INVALID_STATUS_TRANSITION con from CANCELADO -> alreadyCancelled', () => {
      expect(
        classifyCancelConflict({
          reason: 'INVALID_STATUS_TRANSITION',
          from: 'CANCELADO',
          to: 'CANCELADO',
        }),
      ).toBe('alreadyCancelled');
    });

    it('INVALID_STATUS_TRANSITION con from inesperado -> unknown', () => {
      expect(
        classifyCancelConflict({
          reason: 'INVALID_STATUS_TRANSITION',
          from: 'PREPARANDO',
          to: 'CANCELADO',
        }),
      ).toBe('unknown');
    });

    it('reason fuera del catálogo de cancelación (ej. de reseñas) -> unknown', () => {
      expect(classifyCancelConflict({ reason: 'REVIEW_ALREADY_EXISTS' })).toBe('unknown');
    });
  });

  describe('fallback legacy (sin reason -- backend desactualizado)', () => {
    it('sin details -> unknown', () => {
      expect(classifyCancelConflict(undefined)).toBe('unknown');
    });

    it('details sin reason reconocido -> unknown', () => {
      expect(classifyCancelConflict({ from: 'ENTREGADO', to: 'CANCELADO' })).toBe('unknown');
    });
  });
});
