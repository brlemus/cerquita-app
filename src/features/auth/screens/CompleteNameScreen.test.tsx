import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { CompleteNameScreen } from './CompleteNameScreen';

const mockSignOut = jest.fn();
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ signOut: mockSignOut }),
  isClerkAPIResponseError: (error: unknown) =>
    typeof error === 'object' && error !== null && 'errors' in error,
}));

describe('CompleteNameScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls onSubmit with the entered name', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<CompleteNameScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByPlaceholderText('Tu nombre'), 'Ana');
    fireEvent.press(screen.getByText('Continuar'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Ana'));
  });

  it('does not call onSubmit when the name is empty', async () => {
    const onSubmit = jest.fn();
    render(<CompleteNameScreen onSubmit={onSubmit} />);

    fireEvent.press(screen.getByText('Continuar'));

    await waitFor(() => expect(screen.getByText('Ingresá tu nombre')).toBeTruthy());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a mapped error message if onSubmit fails', async () => {
    const onSubmit = jest.fn().mockRejectedValue({ errors: [{ code: 'form_password_incorrect' }] });
    render(<CompleteNameScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByPlaceholderText('Tu nombre'), 'Ana');
    fireEvent.press(screen.getByText('Continuar'));

    await waitFor(() => expect(screen.getByText('La contraseña es incorrecta.')).toBeTruthy());
  });

  it('never leaves the user stuck — offers sign out as an escape', () => {
    render(<CompleteNameScreen onSubmit={jest.fn()} />);

    fireEvent.press(screen.getByText('Cerrar sesión'));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
