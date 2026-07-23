import { Platform } from 'react-native';

import { getDevicePlatform } from './getDevicePlatform';

describe('getDevicePlatform', () => {
  afterEach(() => {
    Platform.OS = 'ios';
  });

  it('devuelve "ios" en iOS', () => {
    Platform.OS = 'ios';
    expect(getDevicePlatform()).toBe('ios');
  });

  it('devuelve "android" en Android', () => {
    Platform.OS = 'android';
    expect(getDevicePlatform()).toBe('android');
  });
});
