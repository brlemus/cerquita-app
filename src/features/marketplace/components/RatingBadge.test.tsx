import { render, screen } from '@testing-library/react-native';

import { RatingBadge } from './RatingBadge';

describe('RatingBadge', () => {
  it('muestra rating y reviewCount cuando avgRating no es null', async () => {
    await render(<RatingBadge avgRating={4.9} reviewCount={128} />);

    expect(screen.getByText('4.9 (128)')).toBeTruthy();
  });

  it('redondea el rating a un decimal', async () => {
    await render(<RatingBadge avgRating={4} reviewCount={0} />);

    expect(screen.getByText('4.0 (0)')).toBeTruthy();
  });

  it('muestra el pill "Nuevo" cuando avgRating es null', async () => {
    await render(<RatingBadge avgRating={null} reviewCount={0} />);

    expect(screen.getByText('Nuevo')).toBeTruthy();
  });
});
