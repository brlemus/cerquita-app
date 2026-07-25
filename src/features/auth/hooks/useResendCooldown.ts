import { useEffect, useState } from 'react';

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Cooldown de "Reenviar código" -- mismo temporizador en los tres flujos
 * de OTP (verificación de registro, segundo factor, reset de contraseña).
 * `restart` se llama tras un reenvío exitoso.
 */
export function useResendCooldown() {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown === 0) {
      return;
    }
    const id = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  function restart() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  return { cooldown, restart };
}
