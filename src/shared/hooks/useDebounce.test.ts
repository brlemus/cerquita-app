import { act, renderHook } from '@testing-library/react-native';

import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('devuelve el valor inicial de entrada', () => {
    const { result } = renderHook(() => useDebounce('a', 300));
    expect(result.current).toBe('a');
  });

  it('no actualiza el valor antes del delay', () => {
    const { result, rerender } = renderHook<string, { value: string }>(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'ab' });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe('a');
  });

  it('actualiza el valor después del delay', () => {
    const { result, rerender } = renderHook<string, { value: string }>(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'ab' });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('ab');
  });

  it('reinicia el timer si el valor cambia antes de que termine el delay', () => {
    const { result, rerender } = renderHook<string, { value: string }>(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'ab' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: 'abc' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('abc');
  });
});
