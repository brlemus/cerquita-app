import type { CartLine } from '@/features/cart/store/cartStore';
import { ApiRequestError } from '@/shared/api';
import { deriveCheckoutError } from './deriveCheckoutError';

const paletaCoco: CartLine = {
  key: 'p1|coco',
  productId: 'p1',
  variantOptionId: 'coco',
  variantOptionName: 'Coco',
  productName: 'Paleta de sobrilla',
  photoUrl: null,
  unitPriceCents: 65,
  quantity: 3,
};

const chocobanano: CartLine = {
  key: 'p2|',
  productId: 'p2',
  productName: 'Chocobanano liso',
  photoUrl: null,
  unitPriceCents: 100,
  quantity: 1,
};

describe('deriveCheckoutError', () => {
  it('devuelve null si no hay error', () => {
    expect(deriveCheckoutError(null, [])).toBeNull();
  });

  it('stockInsufficient con variantOptionId matcheado: menciona la línea', () => {
    const error = new ApiRequestError({
      kind: 'conflict',
      status: 409,
      message: 'Insufficient stock',
      details: { variantOptionId: 'coco', quantity: 3 },
    });
    const view = deriveCheckoutError(error, [paletaCoco, chocobanano]);
    expect(view).toEqual({
      message: 'No hay stock suficiente de Paleta de sobrilla — Coco',
      actionLabel: 'Ajustar carrito',
      action: 'goToCart',
    });
  });

  it('stockInsufficient con productId matcheado (sin variante): menciona la línea', () => {
    const error = new ApiRequestError({
      kind: 'conflict',
      status: 409,
      message: 'Insufficient stock',
      details: { productId: 'p2', quantity: 1 },
    });
    const view = deriveCheckoutError(error, [paletaCoco, chocobanano]);
    expect(view?.message).toBe('No hay stock suficiente de Chocobanano liso');
  });

  it('stockInsufficient sin línea que matchee: copy genérica, no un hueco vacío', () => {
    const error = new ApiRequestError({
      kind: 'conflict',
      status: 409,
      message: 'Insufficient stock',
      details: { variantOptionId: 'ya-no-existe', quantity: 1 },
    });
    const view = deriveCheckoutError(error, [paletaCoco]);
    expect(view?.message).toBe('Algunos productos no tienen stock suficiente');
  });

  it('businessClosed', () => {
    const error = new ApiRequestError({
      kind: 'conflict',
      status: 409,
      message: 'Business is not accepting orders right now',
      details: { businessId: 'b1', status: 'ACTIVE', isOpen: false },
    });
    const view = deriveCheckoutError(error, []);
    expect(view).toEqual({
      message: 'Este negocio no está aceptando pedidos ahora',
      actionLabel: 'Volver al inicio',
      action: 'goToHome',
    });
  });

  it('minOrderNotMet (conflict sin details)', () => {
    const error = new ApiRequestError({
      kind: 'conflict',
      status: 409,
      message: 'Order subtotal (650) is below the business minimum (800)',
    });
    const view = deriveCheckoutError(error, []);
    expect(view).toEqual({
      message: 'Tu pedido no alcanza el mínimo de compra de este negocio',
      actionLabel: 'Volver al carrito',
      action: 'goToCart',
    });
  });

  it('conflict no reconocido: usa el message del backend, acción reintentar', () => {
    const error = new ApiRequestError({
      kind: 'conflict',
      status: 409,
      message: 'Something new the backend added',
      details: { somethingElse: true },
    });
    const view = deriveCheckoutError(error, []);
    expect(view).toEqual({
      message: 'Something new the backend added',
      actionLabel: 'Reintentar',
      action: 'retry',
    });
  });

  it('notFound', () => {
    const error = new ApiRequestError({ kind: 'notFound', status: 404, message: 'not found' });
    const view = deriveCheckoutError(error, []);
    expect(view?.action).toBe('goToCart');
    expect(view?.message).toBe('Uno de los datos de tu pedido ya no está disponible');
  });

  it('validation', () => {
    const error = new ApiRequestError({ kind: 'validation', status: 400, message: 'bad request' });
    const view = deriveCheckoutError(error, []);
    expect(view?.action).toBe('goToCart');
  });

  it('network: acción reintentar', () => {
    const error = new ApiRequestError({ kind: 'network', message: 'fetch failed' });
    const view = deriveCheckoutError(error, []);
    expect(view).toEqual({
      message: 'No pudimos conectar. Intentá de nuevo.',
      actionLabel: 'Reintentar',
      action: 'retry',
    });
  });

  it('error que no es ApiRequestError: fallback de red genérico', () => {
    const view = deriveCheckoutError(new Error('boom'), []);
    expect(view?.action).toBe('retry');
  });
});
