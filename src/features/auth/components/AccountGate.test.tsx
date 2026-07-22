import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ApiRequestError } from '@/shared/api';

import { AccountGate } from './AccountGate';
import { useAuthMe } from '../hooks/useAuthMe';

jest.mock('../hooks/useAuthMe');
const mockUseAuthMe = useAuthMe as jest.Mock;

const mockSignOut = jest.fn();
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ signOut: mockSignOut }),
}));

function mockQuery(overrides: Record<string, unknown>) {
  mockUseAuthMe.mockReturnValue({
    data: undefined,
    error: null,
    isPending: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  });
}

describe('AccountGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state while the query is pending', () => {
    mockQuery({ isPending: true });

    render(
      <AccountGate>
        <Text>Home</Text>
      </AccountGate>,
    );

    expect(screen.getByTestId('account-gate-loading')).toBeTruthy();
    expect(screen.queryByText('Home')).toBeNull();
  });

  it('renders children once /auth/me resolves', () => {
    mockQuery({ data: { id: '1', status: 'ACTIVE' } });

    render(
      <AccountGate>
        <Text>Home</Text>
      </AccountGate>,
    );

    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('shows the suspended screen on 403 suspended', () => {
    mockQuery({
      error: new ApiRequestError({ kind: 'suspended', status: 403, message: 'User is suspended' }),
    });

    render(
      <AccountGate>
        <Text>Home</Text>
      </AccountGate>,
    );

    expect(screen.getByText('Tu cuenta está bloqueada')).toBeTruthy();
  });

  it('shows the suspended screen on 409 re-register blocked (same treatment)', () => {
    mockQuery({
      error: new ApiRequestError({ kind: 'reRegisterBlocked', status: 409, message: 'x' }),
    });

    render(
      <AccountGate>
        <Text>Home</Text>
      </AccountGate>,
    );

    expect(screen.getByText('Tu cuenta está bloqueada')).toBeTruthy();
  });

  it('signs out and shows loading (not the suspended screen) on 401', () => {
    mockQuery({
      error: new ApiRequestError({ kind: 'unauthorized', status: 401, message: 'x' }),
    });

    render(
      <AccountGate>
        <Text>Home</Text>
      </AccountGate>,
    );

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('account-gate-loading')).toBeTruthy();
    expect(screen.queryByText('Tu cuenta está bloqueada')).toBeNull();
  });

  it('shows a retry state for other errors (network/server) and refetches on tap', () => {
    const refetch = jest.fn();
    mockQuery({
      error: new ApiRequestError({ kind: 'network', message: 'x' }),
      refetch,
    });

    render(
      <AccountGate>
        <Text>Home</Text>
      </AccountGate>,
    );

    fireEvent.press(screen.getByText('Reintentar'));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
