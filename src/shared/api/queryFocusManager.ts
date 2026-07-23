import { focusManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

let initialized = false;

/**
 * Receta oficial de TanStack Query para React Native: sin esto,
 * `focusManager` nunca sabe que la app pasó a background, y
 * `refetchInterval`/`refetchIntervalInBackground` no tienen nada que
 * pausar. Reemplaza a un `useAppState` propio para el caso de polling
 * (Fase 5) -- construirlo hubiera duplicado este mecanismo sin ganar nada.
 */
export function initQueryFocusManager(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  AppState.addEventListener('change', (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  });
}
