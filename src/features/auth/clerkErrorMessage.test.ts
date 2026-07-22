import { getClerkErrorMessage, getIncompleteSignInMessage } from './clerkErrorMessage';

jest.mock('@clerk/clerk-expo', () => ({
  isClerkAPIResponseError: (error: unknown) =>
    typeof error === 'object' && error !== null && 'errors' in error,
}));

describe('getClerkErrorMessage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps a known Clerk error code to Spanish copy', () => {
    const error = { errors: [{ code: 'form_password_incorrect' }] };
    expect(getClerkErrorMessage(error)).toBe('La contraseña es incorrecta.');
  });

  it('maps an account with no password strategy configured (dashboard-created users)', () => {
    const error = { errors: [{ code: 'strategy_for_user_invalid' }] };
    expect(getClerkErrorMessage(error)).toContain('no tiene una contraseña configurada');
  });

  it('maps account lockout after too many attempts', () => {
    const error = { errors: [{ code: 'user_locked' }] };
    expect(getClerkErrorMessage(error)).toContain('bloqueó temporalmente');
  });

  it('falls back to a generic Spanish message for unmapped codes and logs the raw code in dev', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const error = { errors: [{ code: 'some_unmapped_code', message: 'raw english text' }] };

    expect(getClerkErrorMessage(error)).toBe('Ocurrió un error. Intentá de nuevo.');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('sin mapear'),
      'some_unmapped_code',
      'raw english text',
    );
  });

  it('falls back to a generic Spanish message for non-Clerk errors', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getClerkErrorMessage(new Error('boom'))).toBe('Ocurrió un error. Intentá de nuevo.');
  });
});

describe('getIncompleteSignInMessage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps needs_second_factor to an actionable MFA-not-supported message', () => {
    expect(getIncompleteSignInMessage('needs_second_factor')).toBe(
      'Esta cuenta tiene verificación en dos pasos, que la app todavía no soporta. Contactá soporte.',
    );
  });

  it('maps needs_first_factor and needs_new_password to actionable messages', () => {
    expect(getIncompleteSignInMessage('needs_first_factor')).toContain('contraseña');
    expect(getIncompleteSignInMessage('needs_new_password')).toContain('contraseña nueva');
  });

  it('falls back to the generic message and logs in dev for an unmapped status', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(getIncompleteSignInMessage('needs_identifier')).toBe(
      'Ocurrió un error. Intentá de nuevo.',
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('sin mapear'), 'needs_identifier');
  });

  it('falls back to the generic message for a null status', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getIncompleteSignInMessage(null)).toBe('Ocurrió un error. Intentá de nuevo.');
  });
});
