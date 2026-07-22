/**
 * DTOs de direcciones y pedidos (docs/API_CONTRACT.md, secciones 2 y 4).
 * Espejo 1:1 del contrato — el backend está fijado, esta app se adapta a él.
 */

export type Address = {
  id: string;
  label?: string;
  line: string;
  instructions?: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
};

export type CreateAddressRequest = {
  label?: string;
  line: string;
  instructions?: string;
  lat: number;
  lng: number;
};

export type UpdateAddressRequest = Partial<CreateAddressRequest>;

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

export type CreateOrderItem = {
  productId: string;
  variantOptionId?: string;
  quantity: number;
};

export type CreateOrderPayload = {
  businessId: string;
  addressId: string;
  items: CreateOrderItem[];
  paymentMethod: 'CASH';
};
