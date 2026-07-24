import { render, screen } from '@testing-library/react-native';

import type { Product } from '../api/types';
import { ProductCard } from './ProductCard';

function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    businessId: 'biz-1',
    catalogCategoryId: null,
    name: 'Paleta de sobrilla',
    description: null,
    photoUrl: null,
    priceCents: 65,
    stock: null,
    isActive: true,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    variantGroups: [],
    ...overrides,
  };
}

describe('ProductCard', () => {
  it('muestra el pill de categoría cuando el backend trae catalogCategoryName', () => {
    render(
      <ProductCard
        product={buildProduct({ catalogCategoryName: 'Postres' })}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Postres')).toBeTruthy();
  });

  it('no muestra pill cuando el backend omite catalogCategoryName', () => {
    render(<ProductCard product={buildProduct()} onPress={jest.fn()} />);

    expect(screen.queryByText('Postres')).toBeNull();
  });
});
