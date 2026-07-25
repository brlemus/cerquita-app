import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAppModeStore } from '../store/appModeStore';

/**
 * `router.replace` (no `push`) reproduce el `history: []` del prototipo
 * (Decisión 5, docs/phases/phase-10-owner-foundations.md): cambiar de modo
 * no deja el modo anterior en la pila de navegación. El destino de
 * `switchToOwner` es Pedidos, no Resumen (Resumen es Fase 13 y no existe
 * todavía).
 */
export function useSwitchMode() {
  const router = useRouter();
  const setMode = useAppModeStore((state) => state.setMode);

  const switchToOwner = useCallback(() => {
    setMode('owner');
    router.replace('/(app)/(owner)/orders');
  }, [router, setMode]);

  const switchToCustomer = useCallback(() => {
    setMode('customer');
    router.replace('/');
  }, [router, setMode]);

  return { switchToOwner, switchToCustomer };
}
