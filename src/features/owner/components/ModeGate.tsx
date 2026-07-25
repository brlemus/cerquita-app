import { Redirect, useSegments } from 'expo-router';
import type { PropsWithChildren } from 'react';

import { useOwnerAccess } from '../hooks/useOwnerAccess';
import { ChooserScreen } from '../screens/ChooserScreen';
import { useAppModeStore } from '../store/appModeStore';

/**
 * Decisión 2 (docs/phases/phase-10-owner-foundations.md): vive en el árbol
 * de render, montado debajo de `AccountGate` -- no como ruta -- para no
 * tener que mantener sincronizados los tres redirects espejados que ya
 * deciden el destino post-login (app/(app)/_layout.tsx,
 * app/(auth)/_layout.tsx, app/sso-callback.tsx).
 *
 * Un customer puro (`!hasBusiness`) nunca ve nada de esto -- ni el
 * chooser, ni una query extra (Decisión 1, corolario duro).
 *
 * Limitación conocida (backlog Fase 11, ver el plan file): un deep link a
 * una ruta `(owner)` mientras el modo persistido es `customer` se
 * redirige acá al modo activo, sin excepción por origen de la navegación.
 */
export function ModeGate({ children }: PropsWithChildren) {
  const { hasBusiness } = useOwnerAccess();
  const mode = useAppModeStore((state) => state.mode);
  const hasHydrated = useAppModeStore((state) => state.hasHydrated);
  const segments = useSegments();

  if (!hasBusiness) {
    return <>{children}</>;
  }

  // Evita el flash del chooser en el arranque en frío: el primer render
  // ocurre con `mode: null` antes de que AsyncStorage responda.
  if (!hasHydrated) {
    return null;
  }

  if (mode === null) {
    return <ChooserScreen />;
  }

  const inOwner = (segments as string[]).includes('(owner)');

  if (mode === 'owner' && !inOwner) {
    return <Redirect href="/(app)/(owner)/orders" />;
  }

  if (mode === 'customer' && inOwner) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}
