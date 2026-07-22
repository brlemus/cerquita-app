import { Text as RNText } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('muestra el título', async () => {
    await render(<EmptyState title="No hay negocios en tu zona" />);

    expect(screen.getByText('No hay negocios en tu zona')).toBeTruthy();
  });

  it('muestra la descripción solo si se pasa', async () => {
    await render(<EmptyState title="Título" description="Descripción" />);

    expect(screen.getByText('Descripción')).toBeTruthy();
  });

  it('no renderiza descripción cuando no se pasa', async () => {
    await render(<EmptyState title="Título" />);

    expect(screen.queryByText('Descripción')).toBeNull();
  });

  it('renderiza el action pasado', async () => {
    await render(<EmptyState title="Título" action={<RNText>Reintentar</RNText>} />);

    expect(screen.getByText('Reintentar')).toBeTruthy();
  });
});
