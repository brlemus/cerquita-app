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
};

/** Respuesta liviana de `GET /orders/:id/status` -- el polling con ETag. */
export type OrderStatusPoll = {
  status: OrderStatus;
  updatedAt: string;
  etaMinutes?: number;
};
