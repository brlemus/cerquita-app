import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import type { ReactNode } from 'react';

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

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));
// useFocusEffect real exige un NavigationContainer real (useRouter no --
// distinta implementación interna); el resto del módulo se deja intacto.
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(effect, []);
  },
}));
// factory explícita: getFcmToken.ts importa @react-native-firebase/messaging
// (módulo nativo no linkeado en test env), mismo criterio que useLogout.test.tsx.
jest.mock('@/features/push/getFcmToken', () => ({ getFcmToken: jest.fn() }));

const mockGetPermissions = Notifications.getPermissionsAsync as jest.Mock;

function renderProfileScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return render(<ProfileScreen />, { wrapper: Wrapper });
}

describe('ProfileScreen', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    mockLogout.mockClear();
    mockGetPermissions.mockResolvedValue({ status: 'granted', canAskAgain: true });
  });

  it('muestra el nombre y el email del usuario', () => {
    renderProfileScreen();

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

    renderProfileScreen();
    fireEvent.press(screen.getByLabelText('Cerrar sesión'));

    expect(useCartStore.getState().lines).toEqual([]);
    expect(useCartStore.getState().businessId).toBeNull();
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
