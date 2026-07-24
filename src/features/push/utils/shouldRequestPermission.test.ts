import type { PermissionStatus } from 'expo-notifications';

import { shouldRequestPermission } from './shouldRequestPermission';

// Literales tipados, no el enum real -- evita pull-in del módulo
// expo-notifications en el entorno de test.
const UNDETERMINED = 'undetermined' as PermissionStatus;
const GRANTED = 'granted' as PermissionStatus;
const DENIED = 'denied' as PermissionStatus;

describe('shouldRequestPermission', () => {
  describe('nunca se intentó en esta instalación', () => {
    it('Android, nunca preguntado (denied + canAskAgain:true) -- pide', () => {
      expect(shouldRequestPermission(DENIED, true, null)).toBe(true);
    });

    it('iOS, nunca preguntado (undetermined + canAskAgain:true) -- pide', () => {
      expect(shouldRequestPermission(UNDETERMINED, true, null)).toBe(true);
    });

    it('denegado permanentemente (canAskAgain:false) -- NO pide, no hay diálogo que mostrar', () => {
      expect(shouldRequestPermission(DENIED, false, null)).toBe(false);
    });

    it('ya estaba concedido (ej. heredado de otra instalación) -- NO pide', () => {
      expect(shouldRequestPermission(GRANTED, true, null)).toBe(false);
    });
  });

  describe('ya se intentó antes en esta instalación', () => {
    it('no vuelve a pedir aunque el permiso siga siendo pedible -- una sola vez por install', () => {
      expect(shouldRequestPermission(DENIED, true, '1')).toBe(false);
      expect(shouldRequestPermission(UNDETERMINED, true, '1')).toBe(false);
    });
  });
});
