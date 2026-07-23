import messaging from '@react-native-firebase/messaging';

/**
 * Camino uniforme Android/iOS (decisión del plan maestro, ver
 * docs/phases/phase-5-tracking.md) -- en iOS hoy rechaza sin la APNs key
 * configurada (Fase 9). Nunca lanza: cualquier caller lo trata como
 * best-effort, `null` es la señal de "no disponible ahora".
 */
export async function getFcmToken(): Promise<string | null> {
  try {
    return await messaging().getToken();
  } catch (error) {
    if (__DEV__) {
      console.log('[push] getFcmToken falló:', error);
    }
    return null;
  }
}
