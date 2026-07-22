import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { SocialSignInButtons } from './SocialSignInButtons';

const mockStartSSOFlow = jest.fn();
jest.mock('@clerk/clerk-expo', () => ({
  useSSO: () => ({ startSSOFlow: mockStartSSOFlow }),
  isClerkAPIResponseError: (error: unknown) =>
    typeof error === 'object' && error !== null && 'errors' in error,
}));

jest.mock('expo-web-browser', () => ({
  warmUpAsync: jest.fn(),
  coolDownAsync: jest.fn(),
}));

jest.mock('expo-apple-authentication', () => {
  const { Pressable, Text } = jest.requireActual('react-native');
  return {
    AppleAuthenticationButton: ({ onPress }: { onPress: () => void }) => (
      <Pressable accessibilityRole="button" testID="apple-button" onPress={onPress}>
        <Text>Apple</Text>
      </Pressable>
    ),
    AppleAuthenticationButtonType: { CONTINUE: 1 },
    AppleAuthenticationButtonStyle: { BLACK: 2 },
  };
});

describe('SocialSignInButtons', () => {
  const originalPlatformOS = Platform.OS;

  afterEach(() => {
    jest.clearAllMocks();
    Platform.OS = originalPlatformOS;
  });

  it('does not render the Apple button on Android', () => {
    Platform.OS = 'android';
    render(<SocialSignInButtons />);
    expect(screen.queryByTestId('apple-button')).toBeNull();
  });

  it('starts the Google OAuth flow and activates the session on success', async () => {
    const setActive = jest.fn();
    mockStartSSOFlow.mockResolvedValue({ createdSessionId: 'sess_123', setActive });

    render(<SocialSignInButtons />);
    fireEvent.press(screen.getByLabelText('Continuar con Google'));

    await waitFor(() => expect(setActive).toHaveBeenCalledWith({ session: 'sess_123' }));
    expect(mockStartSSOFlow).toHaveBeenCalledWith({ strategy: 'oauth_google' });
  });

  it('starts the Apple OAuth flow on iOS', async () => {
    Platform.OS = 'ios';
    const setActive = jest.fn();
    mockStartSSOFlow.mockResolvedValue({ createdSessionId: 'sess_456', setActive });

    render(<SocialSignInButtons />);
    fireEvent.press(screen.getByTestId('apple-button'));

    await waitFor(() => expect(setActive).toHaveBeenCalledWith({ session: 'sess_456' }));
    expect(mockStartSSOFlow).toHaveBeenCalledWith({ strategy: 'oauth_apple' });
  });

  it('does nothing and reports no error when the user cancels the flow', async () => {
    const onError = jest.fn();
    mockStartSSOFlow.mockResolvedValue({ createdSessionId: null, setActive: undefined });

    render(<SocialSignInButtons onError={onError} />);
    fireEvent.press(screen.getByLabelText('Continuar con Google'));

    await waitFor(() => expect(mockStartSSOFlow).toHaveBeenCalled());
    expect(onError).not.toHaveBeenCalledWith(expect.stringContaining('error'));
  });

  it('reports a mapped error message when the flow throws', async () => {
    const onError = jest.fn();
    mockStartSSOFlow.mockRejectedValue(
      Object.assign(new Error('boom'), { errors: [{ code: 'external_account_exists' }] }),
    );

    render(<SocialSignInButtons onError={onError} />);
    fireEvent.press(screen.getByLabelText('Continuar con Google'));

    await waitFor(() => expect(onError).toHaveBeenCalled());
  });
});
