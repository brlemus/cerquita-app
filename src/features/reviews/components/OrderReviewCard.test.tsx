import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useReviewedOrdersStore } from '../store/reviewedOrdersStore';
import { OrderReviewCard } from './OrderReviewCard';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory se hoistea, no puede referenciar un import de módulo externo
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../api/createReview');

function renderCard(review: { id: string; rating: number; createdAt: string } | null = null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return render(<OrderReviewCard orderId="order-1" review={review} />, { wrapper: Wrapper });
}

describe('OrderReviewCard', () => {
  beforeEach(() => {
    useReviewedOrdersStore.setState({ reviewedIds: [] });
  });

  it('sin review del backend y sin marca local: muestra el formulario', () => {
    renderCard(null);

    expect(screen.getByText('¿Cómo te fue con tu pedido?')).toBeTruthy();
  });

  it('con review del backend: muestra "gracias" con las estrellas reales', () => {
    renderCard({ id: 'r1', rating: 4, createdAt: '2026-07-20T00:00:00.000Z' });

    expect(screen.getByText('¡Gracias por tu reseña!')).toBeTruthy();
    expect(screen.getByLabelText('4 de 5 estrellas')).toBeTruthy();
  });

  it('marcado solo localmente (optimista, sin review del backend todavía): también muestra "gracias"', () => {
    useReviewedOrdersStore.getState().markReviewed('order-1');

    renderCard(null);

    expect(screen.getByText('¡Gracias por tu reseña!')).toBeTruthy();
  });
});
