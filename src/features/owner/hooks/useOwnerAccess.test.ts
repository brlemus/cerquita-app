import { renderHook } from '@testing-library/react-native';

import { useAuthMe } from '@/features/auth/hooks/useAuthMe';

import { useOwnerAccess } from './useOwnerAccess';

jest.mock('@/features/auth/hooks/useAuthMe');
const mockUseAuthMe = useAuthMe as jest.Mock;

function mockAuthMeData(data: Record<string, unknown> | undefined) {
  mockUseAuthMe.mockReturnValue({ data });
}

describe('useOwnerAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hasBusiness true cuando el rol es BUSINESS_OWNER y hay businessId', () => {
    mockAuthMeData({ role: 'BUSINESS_OWNER', businessId: 'biz-1' });

    const { result } = renderHook(() => useOwnerAccess());

    expect(result.current).toEqual({ hasBusiness: true, businessId: 'biz-1' });
  });

  it('hasBusiness false cuando el rol es BUSINESS_OWNER pero businessId es null (estado incoherente)', () => {
    mockAuthMeData({ role: 'BUSINESS_OWNER', businessId: null });

    const { result } = renderHook(() => useOwnerAccess());

    expect(result.current).toEqual({ hasBusiness: false, businessId: null });
  });

  it('hasBusiness false para un CUSTOMER puro', () => {
    mockAuthMeData({ role: 'CUSTOMER', businessId: null });

    const { result } = renderHook(() => useOwnerAccess());

    expect(result.current).toEqual({ hasBusiness: false, businessId: null });
  });

  it('hasBusiness false si el rol es CUSTOMER aunque venga un businessId (estado incoherente)', () => {
    mockAuthMeData({ role: 'CUSTOMER', businessId: 'biz-1' });

    const { result } = renderHook(() => useOwnerAccess());

    expect(result.current).toEqual({ hasBusiness: false, businessId: null });
  });

  it('hasBusiness false mientras /auth/me no resolvió', () => {
    mockAuthMeData(undefined);

    const { result } = renderHook(() => useOwnerAccess());

    expect(result.current).toEqual({ hasBusiness: false, businessId: null });
  });
});
