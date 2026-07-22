import { fireEvent, render, screen } from '@testing-library/react-native';

import { CategoryChips } from './CategoryChips';

const categories = [
  { id: 'c1', name: 'Postres', icon: null, sortOrder: 0, createdAt: '2026-01-01' },
  { id: 'c2', name: 'Comida', icon: null, sortOrder: 1, createdAt: '2026-01-01' },
];

describe('CategoryChips', () => {
  it('siempre renderiza el chip "Todos"', async () => {
    await render(<CategoryChips categories={[]} selectedId={null} onSelect={jest.fn()} />);

    expect(screen.getByText('Todos')).toBeTruthy();
  });

  it('renderiza un chip por categoría', async () => {
    await render(<CategoryChips categories={categories} selectedId={null} onSelect={jest.fn()} />);

    expect(screen.getByText('Postres')).toBeTruthy();
    expect(screen.getByText('Comida')).toBeTruthy();
  });

  it('llama a onSelect con el id de la categoría tocada', async () => {
    const onSelect = jest.fn();
    await render(<CategoryChips categories={categories} selectedId={null} onSelect={onSelect} />);

    fireEvent.press(screen.getByText('Postres'));

    expect(onSelect).toHaveBeenCalledWith('c1');
  });

  it('llama a onSelect con null al tocar "Todos"', async () => {
    const onSelect = jest.fn();
    await render(<CategoryChips categories={categories} selectedId="c1" onSelect={onSelect} />);

    fireEvent.press(screen.getByText('Todos'));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('marca como seleccionado el chip activo', async () => {
    await render(<CategoryChips categories={categories} selectedId="c1" onSelect={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Postres' }).props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByRole('button', { name: 'Comida' }).props.accessibilityState).toMatchObject({
      selected: false,
    });
  });
});
