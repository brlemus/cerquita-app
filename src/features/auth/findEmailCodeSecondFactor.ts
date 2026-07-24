import type { SignInSecondFactor, SignInStatus } from '@clerk/types';

export type EmailCodeSecondFactor = {
  emailAddressId: string;
  safeIdentifier: string;
};

/**
 * La app soporta un único segundo factor: `email_code` (mismo patrón de
 * `VerifyEmailScreen`, reusado acá). TOTP/backup_code/phone_code/
 * email_link quedan sin soportar -- ver `getIncompleteSignInMessage`
 * para el copy de esos casos. Verificado contra `@clerk/types`, no
 * supuesto: `SignInSecondFactor` discrimina por `strategy`,
 * `EmailCodeFactor` trae `emailAddressId` (lo que pide
 * `prepareSecondFactor`) y `safeIdentifier` (el email enmascarado para
 * mostrar en el copy).
 */
export function findEmailCodeSecondFactor(
  status: SignInStatus | null | undefined,
  supportedSecondFactors: SignInSecondFactor[] | null | undefined,
): EmailCodeSecondFactor | null {
  if (status !== 'needs_second_factor') {
    return null;
  }
  const factor = supportedSecondFactors?.find((f) => f.strategy === 'email_code');
  if (!factor) {
    return null;
  }
  return { emailAddressId: factor.emailAddressId, safeIdentifier: factor.safeIdentifier };
}
