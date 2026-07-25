import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import type { ReactNode } from 'react';

import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
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

// useOwnerAccess envuelve useAuthMe -- mockeado acá para no depender de la
// query real (misma estrategia que AccountGate.test.tsx).
jest.mock('@/features/auth/hooks/useAuthMe');
const mockUseAuthMe = useAuthMe as jest.Mock;

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
    mockLogout.mockClear();
    mockGetPermissions.mockResolvedValue({ status: 'granted', canAskAgain: true });
    mockUseAuthMe.mockReturnValue({ data: { role: 'CUSTOMER', businessId: null } });
  });

  it('muestra el nombre y el email del usuario', () => {
    renderProfileScreen();

    expect(screen.getByText('Ana Torres')).toBeTruthy();
    expect(screen.getByText('ana@example.com')).toBeTruthy();
  });

  it('cerrar sesión invoca logout() -- la limpieza de carrito/modo vive en useLogout', () => {
    renderProfileScreen();
    fireEvent.press(screen.getByLabelText('Cerrar sesión'));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('sin negocio: no muestra la fila de cambio de modo', () => {
    renderProfileScreen();

    expect(screen.queryByText('Cambiar a administrar mi tienda')).toBeNull();
  });

  it('con negocio: muestra la fila de cambio de modo', () => {
    mockUseAuthMe.mockReturnValue({ data: { role: 'BUSINESS_OWNER', businessId: 'biz-1' } });

    renderProfileScreen();

    expect(screen.getByText('Cambiar a administrar mi tienda')).toBeTruthy();
  });
});
