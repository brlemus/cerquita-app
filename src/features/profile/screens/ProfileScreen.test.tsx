import { fireEvent, render, screen } from '@testing-library/react-native';

import { useCartStore } from '@/features/cart/store/cartStore';
import { ProfileScreen } from './ProfileScreen';

const mockLogout = jest.fn();
jest.mock('@/features/auth/hooks/useLogout', () => ({
  useLogout: () => mockLogout,
}));

const mockUser = {
  fullName: 'Ana Torres',
  firstName: 'Ana',
  primaryEmailAddress: { emailAddress: 'ana@example.com' },
};

jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({ user: mockUser }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory se hoistea, no puede referenciar un import de módulo externo
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('ProfileScreen', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    mockLogout.mockClear();
  });

  it('muestra el nombre y el email del usuario', () => {
    render(<ProfileScreen />);

    expect(screen.getByText('Ana Torres')).toBeTruthy();
    expect(screen.getByText('ana@example.com')).toBeTruthy();
  });

  it('cerrar sesión limpia el carrito además de invocar logout()', () => {
    useCartStore.getState().addLine('b1', 'Paletería Lili', {
      productId: 'p1',
      productName: 'Paleta de sombrilla',
      photoUrl: null,
      unitPriceCents: 65,
      quantity: 2,
    });
    expect(useCartStore.getState().lines).toHaveLength(1);

    render(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText('Cerrar sesión'));

    expect(useCartStore.getState().lines).toEqual([]);
    expect(useCartStore.getState().businessId).toBeNull();
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
