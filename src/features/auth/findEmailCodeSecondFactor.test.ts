import type { SignInSecondFactor } from '@clerk/types';

import { findEmailCodeSecondFactor } from './findEmailCodeSecondFactor';

const emailCodeFactor: SignInSecondFactor = {
  strategy: 'email_code',
  emailAddressId: 'idn_email_1',
  safeIdentifier: 'b***@outlook.com',
  primary: true,
};

const totpFactor: SignInSecondFactor = { strategy: 'totp' };

describe('findEmailCodeSecondFactor', () => {
  it('devuelve el factor cuando el status es needs_second_factor y email_code está disponible', () => {
    expect(findEmailCodeSecondFactor('needs_second_factor', [emailCodeFactor])).toEqual({
      emailAddressId: 'idn_email_1',
      safeIdentifier: 'b***@outlook.com',
    });
  });

  it('encuentra email_code aunque no sea el primero de la lista (ej. TOTP viejo primero, email_code de fallback)', () => {
    expect(findEmailCodeSecondFactor('needs_second_factor', [totpFactor, emailCodeFactor])).toEqual(
      {
        emailAddressId: 'idn_email_1',
        safeIdentifier: 'b***@outlook.com',
      },
    );
  });

  it('devuelve null si el segundo factor disponible no incluye email_code (ej. solo TOTP)', () => {
    expect(findEmailCodeSecondFactor('needs_second_factor', [totpFactor])).toBeNull();
  });

  it('devuelve null si el status no es needs_second_factor, aunque haya factores', () => {
    expect(findEmailCodeSecondFactor('complete', [emailCodeFactor])).toBeNull();
  });

  it('devuelve null si supportedSecondFactors es null o vacío', () => {
    expect(findEmailCodeSecondFactor('needs_second_factor', null)).toBeNull();
    expect(findEmailCodeSecondFactor('needs_second_factor', [])).toBeNull();
  });
});
