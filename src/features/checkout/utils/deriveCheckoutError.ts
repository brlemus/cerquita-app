import type { CartLine } from '@/features/cart/store/cartStore';
import { ApiRequestError } from '@/shared/api';
import { classifyOrderConflict, extractStockConflictLine } from './classifyOrderConflict';

export type CheckoutErrorAction = 'goToCart' | 'goToHome' | 'retry';

export type CheckoutErrorView = {
  message: string;
  actionLabel: string;
  action: CheckoutErrorAction;
};

function matchStockLine(
  lines: CartLine[],
  stockLine: { productId?: string; variantOptionId?: string } | undefined,
): CartLine | undefined {
  if (!stockLine) return undefined;
  return lines.find((line) =>
    stockLine.variantOptionId
      ? line.variantOptionId === stockLine.variantOptionId
      : line.productId === stockLine.productId && !line.variantOptionId,
  );
}

/**
 * Deriva copy + acción a partir del error de POST /orders. Pura y
 * testeada -- ver docs/phases/phase-4-checkout.md, sección
 * "Clasificación de errores de POST /orders".
 */
export function deriveCheckoutError(error: unknown, lines: CartLine[]): CheckoutErrorView | null {
  if (!error) return null;

  if (!(error instanceof ApiRequestError)) {
    return {
      message: 'No pudimos conectar. Intentá de nuevo.',
      actionLabel: 'Reintentar',
      action: 'retry',
    };
  }

  const apiError = error.error;

  if (apiError.kind === 'conflict') {
    const conflictKind = classifyOrderConflict(apiError.details);

    if (conflictKind === 'stockInsufficient') {
      const matched = matchStockLine(lines, extractStockConflictLine(apiError.details));
      const message = matched
        ? `No hay stock suficiente de ${matched.productName}${
            matched.variantOptionName ? ` — ${matched.variantOptionName}` : ''
          }`
        : 'Algunos productos no tienen stock suficiente';
      return { message, actionLabel: 'Ajustar carrito', action: 'goToCart' };
    }

    if (conflictKind === 'businessClosed') {
      return {
        message: 'Este negocio no está aceptando pedidos ahora',
        actionLabel: 'Volver al inicio',
        action: 'goToHome',
      };
    }

    if (conflictKind === 'minOrderNotMet') {
      return {
        message: 'Tu pedido no alcanza el mínimo de compra de este negocio',
        actionLabel: 'Volver al carrito',
        action: 'goToCart',
      };
    }

    return { message: apiError.message, actionLabel: 'Reintentar', action: 'retry' };
  }

  if (apiError.kind === 'notFound') {
    return {
      message: 'Uno de los datos de tu pedido ya no está disponible',
      actionLabel: 'Volver al carrito',
      action: 'goToCart',
    };
  }

  if (apiError.kind === 'validation') {
    return {
      message: 'No pudimos procesar tu pedido. Revisá el carrito e intentá de nuevo.',
      actionLabel: 'Volver al carrito',
      action: 'goToCart',
    };
  }

  return {
    message: 'No pudimos conectar. Intentá de nuevo.',
    actionLabel: 'Reintentar',
    action: 'retry',
  };
}
