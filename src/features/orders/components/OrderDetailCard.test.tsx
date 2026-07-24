import { render, screen } from '@testing-library/react-native';

import type { Order } from '../api/types';
import { OrderDetailCard } from './OrderDetailCard';

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    businessId: 'biz-1',
    businessName: 'Paletería Lili',
    logoUrl: null,
    customerId: 'cus-1',
    status: 'PENDIENTE',
    items: [{ productId: 'p1', quantity: 2, unitPriceCents: 500, productName: 'Paleta' }],
    addressLine: 'Frente a la tienda',
    addressLat: 13.7,
    addressLng: -89.2,
    subtotalCents: 1000,
    deliveryFeeCents: 100,
    commissionCents: 50,
    totalCents: 1100,
    paymentMethod: 'CASH',
    createdAt: '2026-07-20T14:30:00.000Z',
    ...overrides,
  };
}

describe('OrderDetailCard', () => {
  it('muestra el nombre del negocio cuando el DTO lo trae', () => {
    render(<OrderDetailCard order={buildOrder({ businessName: 'Paletería Lili' })} />);

    expect(screen.getByText('Paletería Lili')).toBeTruthy();
  });

  it('no muestra la fila de negocio cuando el backend omite businessName', () => {
    render(<OrderDetailCard order={buildOrder({ businessName: undefined })} />);

    expect(screen.queryByText('Paletería Lili')).toBeNull();
  });

  it('muestra cada item con cantidad, nombre y variante', () => {
    render(
      <OrderDetailCard
        order={buildOrder({
          items: [
            {
              productId: 'p1',
              variantOptionId: 'coco',
              variantOptionName: 'Coco',
              quantity: 3,
              unitPriceCents: 65,
              productName: 'Paleta de sombrilla',
            },
          ],
        })}
      />,
    );

    expect(screen.getByText('3× Paleta de sombrilla — Coco')).toBeTruthy();
    expect(screen.getByText('$1.95')).toBeTruthy();
  });

  it('muestra subtotal, envío y total formateados', () => {
    render(
      <OrderDetailCard
        order={buildOrder({
          items: [{ productId: 'p1', quantity: 2, unitPriceCents: 300, productName: 'Paleta' }],
          subtotalCents: 700,
          deliveryFeeCents: 150,
          totalCents: 850,
        })}
      />,
    );

    expect(screen.getByText('$7.00')).toBeTruthy();
    expect(screen.getByText('$1.50')).toBeTruthy();
    expect(screen.getByText('$8.50')).toBeTruthy();
  });

  it('muestra la dirección y las instrucciones cuando existen', () => {
    render(
      <OrderDetailCard
        order={buildOrder({ addressLine: 'Casa azul', instructions: 'Portón blanco' })}
      />,
    );

    expect(screen.getByText('Casa azul')).toBeTruthy();
    expect(screen.getByText('Portón blanco')).toBeTruthy();
  });

  it('no muestra la fila de instrucciones cuando no hay', () => {
    render(<OrderDetailCard order={buildOrder({ instructions: undefined })} />);

    expect(screen.queryByText('Instrucciones')).toBeNull();
  });

  it('muestra la forma de pago', () => {
    render(<OrderDetailCard order={buildOrder({ paymentMethod: 'CASH' })} />);

    expect(screen.getByText('Efectivo contra entrega')).toBeTruthy();
  });
});
