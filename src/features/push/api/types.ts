/** `POST`/`DELETE /devices` (docs/API_CONTRACT.md, sección 5). */

export type RegisterDeviceRequest = {
  fcmToken: string;
  platform?: 'ios' | 'android';
};

export type UnregisterDeviceRequest = {
  fcmToken: string;
};
