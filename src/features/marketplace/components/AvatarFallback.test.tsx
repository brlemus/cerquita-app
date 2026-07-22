import { render, screen } from '@testing-library/react-native';

import { AvatarFallback } from './AvatarFallback';

describe('AvatarFallback', () => {
  it('muestra las iniciales de las primeras dos palabras', async () => {
    await render(<AvatarFallback label="Paletería Lili" size={64} />);

    expect(screen.getByText('PL')).toBeTruthy();
  });

  it('muestra las primeras dos letras si es una sola palabra', async () => {
    await render(<AvatarFallback label="Frutería" size={64} />);

    expect(screen.getByText('FR')).toBeTruthy();
  });

  it('no muestra iniciales cuando hay logoUrl', async () => {
    await render(
      <AvatarFallback uri="https://example.com/logo.png" label="Paletería Lili" size={64} />,
    );

    expect(screen.queryByText('PL')).toBeNull();
  });
});
