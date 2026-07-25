import type { SignInFirstFactor } from '@clerk/types';

import { getResetPasswordAvailability, getSocialOnlyMessage } from './resetPasswordFactor';

const resetFactor: SignInFirstFactor = {
  strategy: 'reset_password_email_code',
  emailAddressId: 'idn_email_1',
  safeIdentifier: 'a***@gmail.com',
};

const googleFactor: SignInFirstFactor = { strategy: 'oauth_google' };
const appleFactor: SignInFirstFactor = { strategy: 'oauth_apple' };
const unknownOauthFactor: SignInFirstFactor = { strategy: 'oauth_github' };

describe('getResetPasswordAvailability', () => {
  it('devuelve available con el emailAddressId y safeIdentifier cuando la cuenta tiene contraseña', () => {
    expect(getResetPasswordAvailability([resetFactor])).toEqual({
      kind: 'available',
      emailAddressId: 'idn_email_1',
      safeIdentifier: 'a***@gmail.com',
    });
  });

  it('devuelve social-only con Google cuando solo hay un factor oauth_google', () => {
    expect(getResetPasswordAvailability([googleFactor])).toEqual({
      kind: 'social-only',
      providers: ['Google'],
    });
  });

  it('devuelve social-only con Apple cuando solo hay un factor oauth_apple', () => {
    expect(getResetPasswordAvailability([appleFactor])).toEqual({
      kind: 'social-only',
      providers: ['Apple'],
    });
  });

  it('devuelve social-only con ambos proveedores, sin duplicar, si la cuenta linkeó Google y Apple', () => {
    expect(getResetPasswordAvailability([googleFactor, appleFactor, googleFactor])).toEqual({
      kind: 'social-only',
      providers: ['Google', 'Apple'],
    });
  });

  it('devuelve social-only con providers vacío si el proveedor oauth no es uno que la app ofrezca', () => {
    expect(getResetPasswordAvailability([unknownOauthFactor])).toEqual({
      kind: 'social-only',
      providers: [],
    });
  });

  it('devuelve unavailable si no hay factor de reset ni factores oauth', () => {
    expect(getResetPasswordAvailability([{ strategy: 'password' }])).toEqual({
      kind: 'unavailable',
    });
  });

  it('devuelve unavailable si supportedFirstFactors es null o vacío', () => {
    expect(getResetPasswordAvailability(null)).toEqual({ kind: 'unavailable' });
    expect(getResetPasswordAvailability([])).toEqual({ kind: 'unavailable' });
  });
});

describe('getSocialOnlyMessage', () => {
  it('nombra el proveedor cuando hay uno solo', () => {
    expect(getSocialOnlyMessage(['Google'])).toContain('Google');
    expect(getSocialOnlyMessage(['Google'])).toContain('ese botón');
  });

  it('nombra ambos proveedores cuando hay más de uno', () => {
    const message = getSocialOnlyMessage(['Google', 'Apple']);
    expect(message).toContain('Google o Apple');
    expect(message).toContain('esos botones');
  });

  it('cae a un mensaje genérico si no hay proveedores reconocidos', () => {
    const message = getSocialOnlyMessage([]);
    expect(message).toContain('no tiene contraseña configurada');
  });
});
