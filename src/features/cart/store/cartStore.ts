import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CartLine = {
  /** `${productId}|${variantOptionId ?? ''}` -- identidad de línea */
  key: string;
  productId: string;
  variantOptionId?: string;
  quantity: number;
  productName: string;
  variantOptionName?: string;
  photoUrl: string | null;
  unitPriceCents: number;
};

export type CartState = {
  businessId: string | null;
  businessName: string | null;
  lines: CartLine[];
};

export type NewCartLine = Omit<CartLine, 'key' | 'quantity'> & { quantity: number };

type CartActions = {
  addLine: (businessId: string, businessName: string, line: NewCartLine) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
};

const initialState: CartState = {
  businessId: null,
  businessName: null,
  lines: [],
};

function lineKey(productId: string, variantOptionId?: string): string {
  return `${productId}|${variantOptionId ?? ''}`;
}

/**
 * Persistencia segura porque POST /orders recalcula todo server-side --
 * no agregar revalidación de precios en el cliente.
 */
export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set) => ({
      ...initialState,
      addLine: (businessId, businessName, line) =>
        set((state) => {
          const key = lineKey(line.productId, line.variantOptionId);
          const sameBusiness = state.businessId === businessId;
          const existingLines = sameBusiness ? state.lines : [];
          const idx = existingLines.findIndex((l) => l.key === key);
          const lines =
            idx >= 0
              ? existingLines.map((l, i) =>
                  i === idx ? { ...l, quantity: l.quantity + line.quantity } : l,
                )
              : [...existingLines, { ...line, key }];
          return { businessId, businessName, lines };
        }),
      updateQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) => (l.key === key ? { ...l, quantity } : l)),
        })),
      removeLine: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clearCart: () => set(initialState),
    }),
    {
      name: '@cerquita/cart',
      storage: createJSONStorage(() => AsyncStorage),
      // El middleware hidrata de forma async al arrancar; el estado inicial
      // (carrito vacío) se ve por un instante antes de hidratar -- sin
      // impacto en esta fase (nada bloquea el arranque en un carrito vacío
      // momentáneo).
      partialize: (state) => ({
        businessId: state.businessId,
        businessName: state.businessName,
        lines: state.lines,
      }),
    },
  ),
);

export function subtotalCents(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0);
}

export function itemCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

/** true si agregar de `businessId` requeriría vaciar un carrito no vacío de otro negocio. */
export function wouldReplaceCart(state: CartState, businessId: string): boolean {
  return state.businessId !== null && state.businessId !== businessId && state.lines.length > 0;
}
