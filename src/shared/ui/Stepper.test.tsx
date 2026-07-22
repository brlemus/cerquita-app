import { fireEvent, render, screen } from '@testing-library/react-native';

import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('llama a onIncrement/onDecrement al tocar cada botón', async () => {
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();
    await render(<Stepper value={2} onIncrement={onIncrement} onDecrement={onDecrement} />);

    fireEvent.press(screen.getByLabelText('Agregar uno'));
    fireEvent.press(screen.getByLabelText('Quitar uno'));

    expect(onIncrement).toHaveBeenCalledTimes(1);
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it('muestra el value actual', async () => {
    await render(<Stepper value={7} onIncrement={jest.fn()} onDecrement={jest.fn()} />);
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('atMax deshabilita solo el botón de incrementar', async () => {
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();
    await render(<Stepper value={5} onIncrement={onIncrement} onDecrement={onDecrement} atMax />);

    fireEvent.press(screen.getByLabelText('Agregar uno'));
    fireEvent.press(screen.getByLabelText('Quitar uno'));

    expect(onIncrement).not.toHaveBeenCalled();
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });

  it('disabled deshabilita ambos botones', async () => {
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();
    await render(
      <Stepper value={1} onIncrement={onIncrement} onDecrement={onDecrement} disabled />,
    );

    fireEvent.press(screen.getByLabelText('Agregar uno'));
    fireEvent.press(screen.getByLabelText('Quitar uno'));

    expect(onIncrement).not.toHaveBeenCalled();
    expect(onDecrement).not.toHaveBeenCalled();
  });
});
