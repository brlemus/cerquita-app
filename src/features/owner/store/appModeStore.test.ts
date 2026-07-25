import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppModeStore } from './appModeStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory se hoistea, no puede referenciar un import de módulo externo
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('appModeStore', () => {
  beforeEach(() => {
    useAppModeStore.setState({ mode: null });
    jest.clearAllMocks();
  });

  it('setMode guarda el modo elegido', () => {
    useAppModeStore.getState().setMode('owner');
    expect(useAppModeStore.getState().mode).toBe('owner');
  });

  it('clearMode vuelve a null (logout)', () => {
    useAppModeStore.getState().setMode('owner');
    useAppModeStore.getState().clearMode();
    expect(useAppModeStore.getState().mode).toBeNull();
  });

  it('persiste el modo', async () => {
    useAppModeStore.getState().setMode('owner');

    await new Promise((resolve) => setTimeout(resolve, 0));
    const persisted = await AsyncStorage.getItem('@cerquita/app-mode');
    const parsed = persisted ? JSON.parse(persisted) : null;
    expect(parsed?.state?.mode).toBe('owner');
  });

  it('hasHydrated pasa a true tras completar la rehidratación', async () => {
    useAppModeStore.setState({ hasHydrated: false });

    await useAppModeStore.persist.rehydrate();

    expect(useAppModeStore.getState().hasHydrated).toBe(true);
  });
});
