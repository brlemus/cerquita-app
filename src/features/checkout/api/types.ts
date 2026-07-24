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

// `Order`/`OrderStatus`/`OrderItem` viven en `@/features/orders/api/types`
// desde la Fase 5 -- checkout crea pedidos, `orders` es dueño de
// leerlos/trackearlos/cancelarlos.

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
