import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

describe('Button', () => {
  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<Button title="Continuar" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button title="Continuar" onPress={onPress} disabled />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', async () => {
    const onPress = jest.fn();
    await render(<Button title="Continuar" onPress={onPress} loading />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.queryByText('Continuar')).toBeNull();
  });
});
