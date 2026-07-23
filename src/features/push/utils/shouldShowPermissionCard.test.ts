import type { PermissionStatus } from 'expo-notifications';

import { shouldShowPermissionCard } from './shouldShowPermissionCard';

// Literales tipados, no el enum real -- evita pull-in del módulo
// expo-notifications en el entorno de test (dispara un warning de
// Expo Go al importarse fuera de un runtime nativo real).
const UNDETERMINED = 'undetermined' as PermissionStatus;
const GRANTED = 'granted' as PermissionStatus;
const DENIED = 'denied' as PermissionStatus;

describe('shouldShowPermissionCard', () => {
  it('muestra la tarjeta cuando el SO nunca preguntó y nosotros tampoco', () => {
    expect(shouldShowPermissionCard(UNDETERMINED, null)).toBe(true);
  });

  it('no muestra si ya se preguntó antes, aunque el status siga undetermined', () => {
    expect(shouldShowPermissionCard(UNDETERMINED, '1')).toBe(false);
  });

  it('no muestra si el permiso ya está granted', () => {
    expect(shouldShowPermissionCard(GRANTED, null)).toBe(false);
  });

  it('no muestra si el permiso fue denegado', () => {
    expect(shouldShowPermissionCard(DENIED, null)).toBe(false);
  });
});
