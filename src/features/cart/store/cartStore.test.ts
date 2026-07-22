import AsyncStorage from '@react-native-async-storage/async-storage';

import { itemCount, subtotalCents, useCartStore, wouldReplaceCart } from './cartStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory se hoistea, no puede referenciar un import de módulo externo
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function paletaLine(quantity: number, variantOptionId = 'coco') {
  return {
    productId: 'p1',
    variantOptionId,
    variantOptionName: 'Coco',
    productName: 'Paleta de sobrilla',
    photoUrl: null,
    unitPriceCents: 65,
    quantity,
  };
}

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    jest.clearAllMocks();
  });

  it('agrega una línea nueva a un carrito vacío', () => {
    useCartStore.getState().addLine('b1', 'Paletería Lili', paletaLine(3));
    const state = useCartStore.getState();
    expect(state.businessId).toBe('b1');
    expect(state.businessName).toBe('Paletería Lili');
    expect(state.lines).toEqual([{ ...paletaLine(3), key: 'p1|coco' }]);
  });

  it('suma la cantidad cuando la misma línea (producto+opción) ya existe', () => {
    useCartStore.getState().addLine('b1', 'Paletería Lili', paletaLine(2, 'coco'));
    useCartStore.getState().addLine('b1', 'Paletería Lili', paletaLine(1, 'coco'));
    const state = useCartStore.getState();
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0].quantity).toBe(3);
  });

  it('agrega una línea separada para otra opción del mismo producto', () => {
    useCartStore.getState().addLine('b1', 'Paletería Lili', paletaLine(2, 'coco'));
    useCartStore.getState().addLine('b1', 'Paletería Lili', paletaLine(1, 'zapote'));
    expect(useCartStore.getState().lines).toHaveLength(2);
  });

  it('addLine con otro negocio reemplaza bizId/lines (la UI decide si confirmar antes)', () => {
    useCartStore.getState().addLine('b1', 'Paletería Lili', paletaLine(2));
    useCartStore.getState().addLine('b2', 'Chocobananos Ro', paletaLine(1, 'unica'));
    const state = useCartStore.getState();
    expect(state.businessId).toBe('b2');
    expect(state.lines).toHaveLength(1);
  });

  it('updateQuantity actualiza la cantidad de una línea existente', () => {
    useCartStore.getState().addLine('b1', 'Paletería Lili', paletaLine(2));
    useCartStore.getState().updateQuantity('p1|coco', 5);
    expect(useCartStore.getState().lines[0].quantity).toBe(5);
  });

  it('updateQuantity a 0 o negativo remueve la línea', () => {
    useCartStore.getState().addLine('b1', 'Paletería Lili', paletaLine(2));
    useCartStore.getState().updateQuantity('p1|coco', 0);
    expect(useCartStore.getState().lines).toHaveLength(0);
  });

  it('removeLine quita una línea puntual', () => {
    useCartStore.getState().addLine('b1', 'Paletería Lili', paletaLine(2, 'coco'));
    useCartStore.getState().addLine('b1', 'Paletería Lili', paletaLine(1, 'zapote'));
    useCartStore.getState().removeLine('p1|coco');
    expect(useCartStore.getState().lines).toEqual([expect.objectContaining({ key: 'p1|zapote' })]);
  });

  it('clearCart deja el store vacío y persiste ese estado vacío', async () => {
    useCartStore.getState().addLine('b1', 'Paletería Lili', paletaLine(2));
    useCartStore.getState().clearCart();

    const state = useCartStore.getState();
    expect(state.businessId).toBeNull();
    expect(state.businessName).toBeNull();
    expect(state.lines).toEqual([]);

    await new Promise((resolve) => setTimeout(resolve, 0));
    const persisted = await AsyncStorage.getItem('@cerquita/cart');
    const parsed = persisted ? JSON.parse(persisted) : null;
    expect(parsed?.state?.lines ?? []).toEqual([]);
    expect(parsed?.state?.businessId ?? null).toBeNull();
  });
});

describe('subtotalCents', () => {
  it('suma unitPriceCents*quantity de todas las líneas', () => {
    expect(
      subtotalCents([
        { ...paletaLine(3, 'coco'), key: 'p1|coco' },
        { ...paletaLine(2, 'zapote'), key: 'p1|zapote' },
      ]),
    ).toBe(65 * 3 + 65 * 2);
  });

  it('devuelve 0 para un carrito vacío', () => {
    expect(subtotalCents([])).toBe(0);
  });
});

describe('itemCount', () => {
  it('suma las cantidades, no la cantidad de líneas', () => {
    expect(
      itemCount([
        { ...paletaLine(3, 'coco'), key: 'p1|coco' },
        { ...paletaLine(2, 'zapote'), key: 'p1|zapote' },
      ]),
    ).toBe(5);
  });
});

describe('wouldReplaceCart', () => {
  it('false si el carrito está vacío', () => {
    expect(wouldReplaceCart({ businessId: null, businessName: null, lines: [] }, 'b1')).toBe(false);
  });

  it('false si es el mismo negocio', () => {
    expect(
      wouldReplaceCart(
        { businessId: 'b1', businessName: 'Paletería Lili', lines: [paletaLine(1) as never] },
        'b1',
      ),
    ).toBe(false);
  });

  it('true si hay líneas de otro negocio', () => {
    expect(
      wouldReplaceCart(
        { businessId: 'b1', businessName: 'Paletería Lili', lines: [paletaLine(1) as never] },
        'b2',
      ),
    ).toBe(true);
  });
});
