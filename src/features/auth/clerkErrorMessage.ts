import { isClerkAPIResponseError } from '@clerk/clerk-expo';

/**
 * Copy en español para los códigos de error de Clerk que sabemos accionar.
 * Códigos confirmados contra @clerk/clerk-js (bundle) y la documentación de
 * Clerk — no se adivinan códigos sin confirmar (mejor caer al fallback +
 * log de dev que afirmar un mapeo incorrecto en silencio).
 */
const MESSAGES: Record<string, string> = {
  form_identifier_not_found: 'No encontramos una cuenta con ese email.',
  form_password_incorrect: 'La contraseña es incorrecta.',
  form_password_or_identifier_incorrect: 'Email o contraseña incorrectos.',
  form_identifier_exists: 'Ya existe una cuenta con ese email.',
  form_password_pwned: 'Esa contraseña no es segura — probá con otra.',
  form_password_compromised: 'Esa contraseña no es segura — probá con otra.',
  form_password_length_too_short: 'La contraseña es muy corta.',
  form_code_incorrect: 'El código es incorrecto.',
  // Cuenta existente sin password configurado para este método (ej. creada
  // a mano desde el dashboard de Clerk) — no es un flujo soportado por la app.
  strategy_for_user_invalid:
    'Esta cuenta no tiene una contraseña configurada para iniciar sesión así. Registrate de nuevo o contactá soporte.',
  user_locked: 'Tu cuenta se bloqueó temporalmente por demasiados intentos. Esperá unos minutos.',
  signup_rate_limit_exceeded: 'Hiciste demasiados intentos. Esperá un momento e intentá de nuevo.',
  captcha_invalid: 'No pudimos verificar que sos una persona. Intentá de nuevo.',
  // OAuth (Google/Apple vía useSSO) — códigos confirmados contra el bundle
  // de @clerk/clerk-js. oauth_access_denied (el usuario cancela desde el
  // navegador) normalmente NO llega acá porque useSSO no tira excepción en
  // ese caso (createdSessionId queda null); se mapea igual por si Clerk lo
  // reporta como excepción en algún borde.
  external_account_exists:
    'Ya existe una cuenta con ese email usando otro método. Iniciá sesión con tu contraseña.',
  oauth_access_denied: 'Cancelaste el inicio de sesión.',
};

const FALLBACK = 'Ocurrió un error. Intentá de nuevo.';

/**
 * Nunca muestra el texto crudo (en inglés) de Clerk — solo copy traducida o
 * el fallback genérico. En dev, loguea el código sin mapear para poder
 * agregarlo a MESSAGES (nunca en producción — no es sensible, es solo un
 * código de error, pero igual se restringe a __DEV__ por disciplina).
 */
export function getClerkErrorMessage(error: unknown): string {
  if (isClerkAPIResponseError(error)) {
    const code = error.errors[0]?.code;
    const rawMessage = error.errors[0]?.message;
    if (code && MESSAGES[code]) {
      if (__DEV__) {
        console.log(
          '[auth] getClerkErrorMessage -- rama MAPEADA, código:',
          code,
          '-> copy:',
          MESSAGES[code],
          '(Clerk dijo:',
          rawMessage,
          ')',
        );
      }
      return MESSAGES[code];
    }
    if (__DEV__) {
      console.warn(
        '[auth] getClerkErrorMessage -- rama FALLBACK, código sin mapear:',
        code,
        rawMessage,
      );
    }
    return FALLBACK;
  }
  if (__DEV__) {
    console.warn(
      '[auth] getClerkErrorMessage -- rama FALLBACK, no es ClerkAPIResponseError:',
      error,
    );
  }
  return FALLBACK;
}

/**
 * Mensajes para un `SignInResource.status` que no es `'complete'` — no es
 * una excepción, es un paso adicional que Clerk pide (`SignInStatus`:
 * 'needs_identifier' | 'needs_first_factor' | 'needs_second_factor' |
 * 'needs_new_password' | 'complete', confirmado contra @clerk/types).
 * La app solo implementa email+password de un factor — MFA es backlog
 * post-MVP (ver docs/phases/phase-1-auth.md). `needs_second_factor` es el
 * único que se vio en la práctica (usuario con MFA enrolado desde el
 * dashboard); el resto son defensivos.
 */
const INCOMPLETE_SIGN_IN_MESSAGES: Record<string, string> = {
  needs_second_factor:
    'Esta cuenta tiene verificación en dos pasos, que la app todavía no soporta. Contactá soporte.',
  needs_first_factor: 'Esta cuenta no puede iniciar sesión con contraseña. Contactá soporte.',
  needs_new_password:
    'Tu cuenta necesita una contraseña nueva. Contactá soporte para restablecerla.',
};

export function getIncompleteSignInMessage(status: string | null | undefined): string {
  if (status && INCOMPLETE_SIGN_IN_MESSAGES[status]) {
    if (__DEV__) {
      console.log(
        '[auth] getIncompleteSignInMessage -- rama MAPEADA, status:',
        status,
        '-> copy:',
        INCOMPLETE_SIGN_IN_MESSAGES[status],
      );
    }
    return INCOMPLETE_SIGN_IN_MESSAGES[status];
  }
  if (__DEV__) {
    console.warn('[auth] getIncompleteSignInMessage -- rama FALLBACK, status sin mapear:', status);
  }
  return FALLBACK;
}
