import { Platform } from 'react-native';

/**
 * `RegisterDeviceRequest.platform` es `'ios' | 'android'` -- este
 * proyecto solo shipea esas dos, así que cualquier otra cosa cae a
 * `'android'` (nunca ocurre en runtime real).
 */
export function getDevicePlatform(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}
