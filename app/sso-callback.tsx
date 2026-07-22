import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';

/**
 * Ruta de aterrizaje del deep link de OAuth (useSSO asume "sso-callback" por
 * default si no se pasa redirectUrl). En Android el sistema entrega ese link
 * también a la capa de linking de Expo Router (no solo a la sesión de auth
 * de expo-web-browser) — sin esta ruta, "Unmatched Route". La sesión ya se
 * creó antes de llegar acá (setActive corrió dentro de handleSSO), así que
 * solo hace falta redirigir a donde ya redirigen los layouts de grupo.
 */
export default function SsoCallback() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  return <Redirect href={isSignedIn ? '/(app)' : '/(auth)/sign-in'} />;
}
