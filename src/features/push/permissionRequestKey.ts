// Aislada en su propio módulo (no vive en PushProvider.tsx): ese archivo
// importa @react-native-firebase/messaging, que exige el módulo nativo
// linkeado -- cualquier consumidor de esta constante (ej. el borrado de
// cuenta de Fase 7a) arrastraría esa dependencia solo para leer un string.
export const PERMISSION_REQUEST_ATTEMPTED_KEY = 'push_permission_requested';
