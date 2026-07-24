import { render, screen } from '@testing-library/react-native';

import type { Order } from '../api/types';
import { OrderRow } from './OrderRow';

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    businessId: 'biz-1',
    customerId: 'cus-1',
    status: 'PENDIENTE',
    items: [{ productId: 'p1', quantity: 1, unitPriceCents: 500, productName: 'Paleta' }],
    addressLine: 'Frente a la tienda',
    addressLat: 13.7,
    addressLng: -89.2,
    subtotalCents: 500,
    deliveryFeeCents: 100,
    commissionCents: 50,
    totalCents: 600,
    paymentMethod: 'CASH',
    createdAt: '2026-07-20T14:30:00.000Z',
    ...overrides,
  };
}

describe('OrderRow', () => {
  it('usa el nombre del negocio como título cuando el DTO lo trae', () => {
    render(<OrderRow order={buildOrder({ businessName: 'Paletería Lili' })} onPress={jest.fn()} />);

    expect(screen.getByText('Paletería Lili')).toBeTruthy();
    expect(screen.getByText(/Pedido #/)).toBeTruthy();
  });

  it('cae al número de pedido como título cuando el backend omite businessName', () => {
    render(<OrderRow order={buildOrder({ businessName: undefined })} onPress={jest.fn()} />);

    expect(screen.getAllByText(/Pedido #/)).toHaveLength(1);
  });
});
