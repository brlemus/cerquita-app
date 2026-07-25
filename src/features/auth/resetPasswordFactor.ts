import type { OauthFactor, ResetPasswordEmailCodeFactor, SignInFirstFactor } from '@clerk/types';

export type SocialProvider = 'Google' | 'Apple';

export type ResetPasswordAvailability =
  | { kind: 'available'; emailAddressId: string; safeIdentifier: string }
  | { kind: 'social-only'; providers: SocialProvider[] }
  | { kind: 'unavailable' };

/**
 * Solo los proveedores que `SocialSignInButtons` ofrece (Google y Apple) --
 * un `oauth_*` no reconocido (proveedor no habilitado en esta app) queda
 * fuera de la lista pero igual cuenta como "cuenta social-only" (ver abajo).
 */
const PROVIDER_LABELS: Partial<Record<OauthFactor['strategy'], SocialProvider>> = {
  oauth_google: 'Google',
  oauth_apple: 'Apple',
};

/**
 * Misma lógica que la propia UI de Clerk (verificada contra el bundle de
 * `clerk-js`, `signin_clerk.browser_*.js`): tras `signIn.create({ identifier })`,
 * `supportedFirstFactors` trae `reset_password_email_code` únicamente si la
 * cuenta tiene contraseña. Si no lo trae pero sí trae factores `oauth_*`, la
 * cuenta se creó solo por social login -- ese es el caso borde de la Fase
 * 7b, y se resuelve con certeza acá (no adivinando un código de error).
 */
export function getResetPasswordAvailability(
  supportedFirstFactors: SignInFirstFactor[] | null | undefined,
): ResetPasswordAvailability {
  const resetFactor = supportedFirstFactors?.find(
    (factor): factor is ResetPasswordEmailCodeFactor =>
      factor.strategy === 'reset_password_email_code',
  );
  if (resetFactor) {
    return {
      kind: 'available',
      emailAddressId: resetFactor.emailAddressId,
      safeIdentifier: resetFactor.safeIdentifier,
    };
  }

  const oauthFactors =
    supportedFirstFactors?.filter((factor): factor is OauthFactor =>
      factor.strategy.startsWith('oauth_'),
    ) ?? [];
  if (oauthFactors.length > 0) {
    const providers = [
      ...new Set(
        oauthFactors
          .map((factor) => PROVIDER_LABELS[factor.strategy])
          .filter((label): label is SocialProvider => Boolean(label)),
      ),
    ];
    return { kind: 'social-only', providers };
  }

  return { kind: 'unavailable' };
}

/**
 * Copy que NOMBRA el proveedor -- nunca un error genérico para este caso,
 * es el requisito explícito de la Fase 7b. Genérico solo si Clerk reportó
 * un proveedor que la app no ofrece (`providers` vacío pese a `social-only`).
 */
export function getSocialOnlyMessage(providers: SocialProvider[]): string {
  if (providers.length === 0) {
    return 'Esta cuenta no tiene contraseña configurada. Volvé e iniciá sesión con el método que usaste para crearla.';
  }
  const list = providers.join(' o ');
  const plural = providers.length > 1 ? 'esos botones' : 'ese botón';
  return `Esta cuenta se creó con ${list}, así que no tiene contraseña. Volvé e iniciá sesión con ${plural}.`;
}
