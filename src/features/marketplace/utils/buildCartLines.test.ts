import type { Product } from '../api/types';
import { buildCartLineForSimpleProduct, buildCartLinesForVariants } from './buildCartLines';

const paleta: Product = {
  id: 'p1',
  businessId: 'b1',
  catalogCategoryId: null,
  name: 'Paleta de sobrilla',
  description: null,
  photoUrl: null,
  priceCents: 65,
  stock: null,
  isActive: true,
  createdAt: '',
  updatedAt: '',
  variantGroups: [
    {
      id: 'g1',
      name: 'Sabor',
      sortOrder: 0,
      options: [
        { id: 'coco', name: 'Coco', priceDeltaCents: 0, stock: 12, isActive: true },
        { id: 'ron', name: 'Ron con pasas', priceDeltaCents: 10, stock: 0, isActive: true },
      ],
    },
  ],
};

const chocobanano: Product = {
  ...paleta,
  id: 'p2',
  name: 'Chocobanano liso',
  priceCents: 100,
  stock: 40,
  variantGroups: [],
};

describe('buildCartLinesForVariants', () => {
  it('devuelve una línea por opción con cantidad > 0', () => {
    const lines = buildCartLinesForVariants(paleta, { coco: 3, ron: 0 });
    expect(lines).toEqual([
      {
        productId: 'p1',
        variantOptionId: 'coco',
        variantOptionName: 'Coco',
        productName: 'Paleta de sobrilla',
        photoUrl: null,
        unitPriceCents: 65,
        quantity: 3,
      },
    ]);
  });

  it('suma el priceDeltaCents de la opción al unitPriceCents', () => {
    const lines = buildCartLinesForVariants(paleta, { ron: 2 });
    expect(lines[0].unitPriceCents).toBe(75);
  });

  it('ignora opciones sin selección u opciones ausentes del mapa', () => {
    expect(buildCartLinesForVariants(paleta, {})).toEqual([]);
  });

  it('devuelve [] para un producto sin grupos de variantes', () => {
    expect(buildCartLinesForVariants(chocobanano, { coco: 1 })).toEqual([]);
  });
});

describe('buildCartLineForSimpleProduct', () => {
  it('devuelve una sola línea sin variantOptionId', () => {
    expect(buildCartLineForSimpleProduct(chocobanano, 2)).toEqual([
      {
        productId: 'p2',
        productName: 'Chocobanano liso',
        photoUrl: null,
        unitPriceCents: 100,
        quantity: 2,
      },
    ]);
  });

  it('devuelve [] si la cantidad es 0 o negativa', () => {
    expect(buildCartLineForSimpleProduct(chocobanano, 0)).toEqual([]);
  });
});
