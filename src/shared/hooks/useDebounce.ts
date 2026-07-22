import { useEffect, useState } from 'react';

/**
 * Debounce de un valor, no de un callback -- nada de closures viejas que
 * cuidar. El caller decide qué hacer con el valor debounced (ej. pasarlo a
 * un hook de query).
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
