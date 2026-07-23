import type { PermissionStatus } from 'expo-notifications';

import { shouldShowPermissionCard } from './shouldShowPermissionCard';

// Literales tipados, no el enum real -- evita pull-in del módulo
// expo-notifications en el entorno de test (dispara un warning de
// Expo Go al importarse fuera de un runtime nativo real).
const UNDETERMINED = 'undetermined' as PermissionStatus;
const GRANTED = 'granted' as PermissionStatus;
const DENIED = 'denied' as PermissionStatus;

describe('shouldShowPermissionCard', () => {
  describe('Android (sin undetermined nativo -- todo lo no-granted llega como denied)', () => {
    it('nunca preguntado (denied + canAskAgain:true) -- muestra', () => {
      expect(shouldShowPermissionCard(DENIED, true, null)).toBe(true);
    });

    it('preguntado y denegado, pero todavía pedible (denied + canAskAgain:true) -- muestra', () => {
      expect(shouldShowPermissionCard(DENIED, true, null)).toBe(true);
    });

    it('denegado permanentemente ("no preguntar de nuevo", canAskAgain:false) -- NO muestra', () => {
      expect(shouldShowPermissionCard(DENIED, false, null)).toBe(false);
    });

    it('ya concedido -- NO muestra', () => {
      expect(shouldShowPermissionCard(GRANTED, true, null)).toBe(false);
    });
  });

  describe('iOS (undetermined nativo real)', () => {
    it('nunca preguntado (undetermined + canAskAgain:true) -- muestra', () => {
      expect(shouldShowPermissionCard(UNDETERMINED, true, null)).toBe(true);
    });

    it('denegado (canAskAgain:false -- iOS no deja re-pedir vía API) -- NO muestra', () => {
      expect(shouldShowPermissionCard(DENIED, false, null)).toBe(false);
    });

    it('ya concedido -- NO muestra', () => {
      expect(shouldShowPermissionCard(GRANTED, true, null)).toBe(false);
    });
  });

  describe('prompted (nuestra propia tarjeta) gana por encima de todo', () => {
    it('pedible pero ya se le mostró la tarjeta antes -- NO muestra', () => {
      expect(shouldShowPermissionCard(DENIED, true, '1')).toBe(false);
      expect(shouldShowPermissionCard(UNDETERMINED, true, '1')).toBe(false);
    });
  });
});
