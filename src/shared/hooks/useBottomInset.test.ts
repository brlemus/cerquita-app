import { renderHook } from '@testing-library/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomInset } from './useBottomInset';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}));
const mockUseSafeAreaInsets = useSafeAreaInsets as jest.Mock;

describe('useBottomInset', () => {
  it('suma el inset inferior real al espaciado de diseño pedido', () => {
    mockUseSafeAreaInsets.mockReturnValue({ top: 0, bottom: 24, left: 0, right: 0 });

    const { result } = renderHook(() => useBottomInset(16));

    expect(result.current).toBe(40);
  });

  it('no pisa el espaciado de diseño cuando el inset del dispositivo es 0', () => {
    mockUseSafeAreaInsets.mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 });

    const { result } = renderHook(() => useBottomInset(16));

    expect(result.current).toBe(16);
  });
});
