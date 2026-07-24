import { act, renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import { getFcmToken } from '@/features/push/getFcmToken';
import { useNotificationPermission } from './useNotificationPermission';

jest.mock('expo-router', () => ({
  // Simula el foco disparando el efecto una sola vez al montar -- alcanza
  // para probar la lógica de refresh/transición, no la mecánica de
  // navegación en sí.
  useFocusEffect: (effect: () => void) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(effect, []);
  },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

// factory explícita: getFcmToken.ts importa @react-native-firebase/messaging
// (módulo nativo no linkeado en test env), mismo criterio que useLogout.test.tsx.
jest.mock('@/features/push/getFcmToken', () => ({ getFcmToken: jest.fn() }));

const mockMutate = jest.fn();
jest.mock('@/features/push/hooks/useRegisterDevice', () => ({
  useRegisterDevice: () => ({ mutate: mockMutate }),
}));

const mockGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockGetFcmToken = getFcmToken as jest.Mock;

describe('useNotificationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'openSettings').mockImplementation(() => Promise.resolve());
  });

  it('refleja el permiso concedido sin registrar el device en la primera lectura', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted', canAskAgain: true });

    const { result } = renderHook(() => useNotificationPermission());
    await act(async () => {});

    expect(result.current.isGranted).toBe(true);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('al pasar de denegado a concedido, registra el device con el token FCM', async () => {
    mockGetPermissions.mockResolvedValueOnce({ status: 'denied', canAskAgain: true });
    const { result } = renderHook(() => useNotificationPermission());
    await act(async () => {});
    expect(result.current.isGranted).toBe(false);

    mockGetPermissions.mockResolvedValueOnce({ status: 'granted', canAskAgain: true });
    mockGetFcmToken.mockResolvedValueOnce('fcm-token-1');
    await act(() => result.current.refresh());

    expect(result.current.isGranted).toBe(true);
    expect(mockMutate).toHaveBeenCalledWith({
      fcmToken: 'fcm-token-1',
      platform: expect.any(String),
    });
  });

  it('requestOrOpenSettings pide el permiso nativo cuando todavía se puede preguntar', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'undetermined', canAskAgain: true });
    mockRequestPermissions.mockResolvedValue({ status: 'granted', canAskAgain: true });
    const { result } = renderHook(() => useNotificationPermission());
    await act(async () => {});

    await act(() => result.current.requestOrOpenSettings());

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(Linking.openSettings).not.toHaveBeenCalled();
  });

  it('requestOrOpenSettings abre los ajustes del sistema cuando ya no se puede volver a preguntar', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'denied', canAskAgain: false });
    const { result } = renderHook(() => useNotificationPermission());
    await act(async () => {});

    await act(() => result.current.requestOrOpenSettings());

    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  });

  it('requestOrOpenSettings abre los ajustes del sistema si ya está concedido', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted', canAskAgain: true });
    const { result } = renderHook(() => useNotificationPermission());
    await act(async () => {});

    await act(() => result.current.requestOrOpenSettings());

    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  });
});
