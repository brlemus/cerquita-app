import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('muestra el mensaje default cuando no se pasa uno', async () => {
    await render(<ErrorState onRetry={jest.fn()} />);

    expect(screen.getByText('Revisá tu conexión e intentá de nuevo.')).toBeTruthy();
  });

  it('muestra el mensaje custom cuando se pasa', async () => {
    await render(<ErrorState message="Este negocio ya no existe." onRetry={jest.fn()} />);

    expect(screen.getByText('Este negocio ya no existe.')).toBeTruthy();
  });

  it('llama a onRetry al tocar el botón', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState onRetry={onRetry} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('muestra el botón en estado loading cuando retrying', async () => {
    await render(<ErrorState onRetry={jest.fn()} retrying />);

    expect(screen.queryByText('Reintentar')).toBeNull();
  });
});
