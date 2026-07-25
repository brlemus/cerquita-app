import { act, renderHook } from '@testing-library/react-native';

import { useResendCooldown } from './useResendCooldown';

describe('useResendCooldown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('arranca en 30 segundos', () => {
    const { result } = renderHook(() => useResendCooldown());
    expect(result.current.cooldown).toBe(30);
  });

  // Cada tick reprograma el próximo `setTimeout` desde un `useEffect` --
  // avanzar el reloj falso de una sola vez no le da a React chance de
  // flushear el efecto entre ticks, así que se avanza de a 1s con su
  // propio `act()` cada uno.
  function advanceSeconds(seconds: number) {
    for (let i = 0; i < seconds; i += 1) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }
  }

  it('decrementa un segundo por vez hasta llegar a 0', () => {
    const { result } = renderHook(() => useResendCooldown());

    advanceSeconds(3);
    expect(result.current.cooldown).toBe(27);

    advanceSeconds(27);
    expect(result.current.cooldown).toBe(0);
  });

  it('no sigue decrementando por debajo de 0', () => {
    const { result } = renderHook(() => useResendCooldown());

    advanceSeconds(35);

    expect(result.current.cooldown).toBe(0);
  });

  it('restart vuelve a arrancar el cooldown en 30', () => {
    const { result } = renderHook(() => useResendCooldown());

    advanceSeconds(10);
    expect(result.current.cooldown).toBe(20);

    act(() => {
      result.current.restart();
    });
    expect(result.current.cooldown).toBe(30);
  });
});
