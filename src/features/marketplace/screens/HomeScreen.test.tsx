import { fireEvent, render, screen } from '@testing-library/react-native';

import { useCartStore } from '@/features/cart/store/cartStore';
import { HomeScreen } from './HomeScreen';

const mockSignOut = jest.fn();
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ signOut: mockSignOut }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../hooks/usePlatformCategories', () => ({
  usePlatformCategories: () => ({ data: [] }),
}));

jest.mock('../hooks/useBusinesses', () => ({
  useBusinesses: () => ({
    data: { pages: [] },
    isPending: false,
    isError: false,
    isRefetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
  }),
}));

jest.mock('@/features/checkout/hooks/useAddresses', () => ({
  useAddresses: () => ({ data: { data: [] } }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory se hoistea, no puede referenciar un import de módulo externo
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('HomeScreen -- logout limpia el carrito', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    mockSignOut.mockClear();
  });

  it('cerrar sesión invoca clearCart() además de signOut()', async () => {
    useCartStore.getState().addLine('b1', 'Paletería Lili', {
      productId: 'p1',
      productName: 'Paleta de sobrilla',
      photoUrl: null,
      unitPriceCents: 65,
      quantity: 2,
    });
    expect(useCartStore.getState().lines).toHaveLength(1);

    await render(<HomeScreen />);
    fireEvent.press(screen.getByLabelText('Cerrar sesión'));

    expect(useCartStore.getState().lines).toEqual([]);
    expect(useCartStore.getState().businessId).toBeNull();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
