import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AppMode = 'customer' | 'owner';

export type AppModeState = {
  mode: AppMode | null;
  hasHydrated: boolean;
};

type AppModeActions = {
  setMode: (mode: AppMode) => void;
  clearMode: () => void;
};

/**
 * Persistido para no re-preguntar "¿Dónde querés entrar?" en cada apertura
 * de la app (Decisión 3, docs/phases/phase-10-owner-foundations.md).
 * `hasHydrated` evita el flash del chooser en el arranque en frío: el
 * primer render ocurre con `mode: null` antes de que AsyncStorage responda,
 * y `ModeGate` debe esperarlo en vez de asumir "sin modo elegido".
 */
export const useAppModeStore = create<AppModeState & AppModeActions>()(
  persist(
    (set) => ({
      mode: null,
      hasHydrated: false,
      setMode: (mode) => set({ mode }),
      // Logout: el próximo login vuelve a mostrar el chooser -- mismo criterio que clearCart()/clearReviewed().
      clearMode: () => set({ mode: null }),
    }),
    {
      name: '@cerquita/app-mode',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => () => {
        useAppModeStore.setState({ hasHydrated: true });
      },
    },
  ),
);
