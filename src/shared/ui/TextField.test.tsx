import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextField } from './TextField';

describe('TextField', () => {
  it('renders the label and forwards text input behavior', () => {
    const onChangeText = jest.fn();
    render(<TextField label="Email" placeholder="tu@correo.com" onChangeText={onChangeText} />);

    expect(screen.getByText('Email')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('tu@correo.com'), 'ana@cerquita.app');
    expect(onChangeText).toHaveBeenCalledWith('ana@cerquita.app');
  });

  it('shows the error message when error is set', () => {
    render(<TextField label="Contraseña" placeholder="••••••" error="Mínimo 6 caracteres" />);

    expect(screen.getByText('Mínimo 6 caracteres')).toBeTruthy();
  });

  it('does not render an error message by default', () => {
    render(<TextField label="Contraseña" placeholder="••••••" />);

    expect(screen.queryByTestId('text-field-error')).toBeNull();
  });

  it('passes secureTextEntry through to the input', () => {
    render(<TextField label="Contraseña" placeholder="••••••" secureTextEntry />);

    expect(screen.getByPlaceholderText('••••••').props.secureTextEntry).toBe(true);
  });

  it('still calls the caller onFocus/onBlur (react-hook-form depende de onBlur para touched)', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    render(
      <TextField
        variant="filled"
        label="Email"
        placeholder="tu@correo.com"
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );
    const input = screen.getByPlaceholderText('tu@correo.com');

    fireEvent(input, 'focus');
    expect(onFocus).toHaveBeenCalledTimes(1);

    fireEvent(input, 'blur');
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('funciona sin onFocus/onBlur del caller (ambos opcionales)', () => {
    render(<TextField variant="filled" label="Email" placeholder="tu@correo.com" />);
    const input = screen.getByPlaceholderText('tu@correo.com');

    expect(() => {
      fireEvent(input, 'focus');
      fireEvent(input, 'blur');
    }).not.toThrow();
  });
});
