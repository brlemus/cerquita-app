import type { OrderReviewSummary } from '@/features/reviews/api/types';

/**
 * DTOs de pedidos (docs/API_CONTRACT.md, sección 4). Espejo 1:1 del
 * contrato -- el backend está fijado, esta app se adapta a él.
 *
 * `Order`/`OrderStatus`/`OrderItem` vivían en `checkout` (creados ahí en
 * la Fase 4) -- se mueven acá en la Fase 5 porque `orders` pasa a ser
 * dueño de leer/trackear/cancelar pedidos (checkout sigue siendo dueño
 * de crearlos, `POST /orders`).
 */

export type OrderStatus = 'PENDIENTE' | 'PREPARANDO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

export type OrderItem = {
  productId: string;
  variantOptionId?: string;
  quantity: number;
  unitPriceCents: number;
  productName: string;
  variantOptionName?: string;
};

export type Order = {
  id: string;
  businessId: string;
  /** Gap de contrato cerrado (Fase 6b) -- opcional por robustez si el backend lo omite. */
  businessName?: string;
  logoUrl?: string | null;
  customerId: string;
  status: OrderStatus;
  items: OrderItem[];
  addressLine: string;
  addressLat: number;
  addressLng: number;
  instructions?: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  commissionCents: number;
  totalCents: number;
  etaMinutes?: number;
  paymentMethod: 'CASH';
  createdAt: string;
  /**
   * Fuente de verdad de "ya calificado" (`review !== null`) -- reemplaza
   * `reviewedOrdersStore`, que pasa a ser cache optimista. `undefined` en
   * respuestas que el contrato declara sin este campo (ninguna hoy en
   * `GET /orders`/`GET /orders/:id`/`POST /orders`; `undefined` es solo
   * defensivo, igual que `businessName?`).
   */
  review?: OrderReviewSummary | null;
};

/** Respuesta liviana de `GET /orders/:id/status` -- el polling con ETag. */
export type OrderStatusPoll = {
  status: OrderStatus;
  updatedAt: string;
  etaMinutes?: number;
};
