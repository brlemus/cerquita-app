import type { NewCartLine } from '@/features/cart/store/cartStore';
import type { Product } from '../api/types';

/**
 * Convierte un producto + estado de selección en las líneas a agregar al
 * carrito. Modelo "cantidad por opción": solo se lee el primer grupo de
 * variantes -- ver docs/phases/phase-3-cart.md (gap de contrato: el DTO
 * permite 2+ grupos por producto, pero POST /orders no puede expresarlos).
 */
export function buildCartLinesForVariants(
  product: Product,
  optionQuantities: Record<string, number>,
): NewCartLine[] {
  const group = product.variantGroups[0];
  if (!group) return [];

  if (product.variantGroups.length > 1 && __DEV__) {
    console.warn(
      `Producto ${product.id} tiene ${product.variantGroups.length} grupos de variantes; solo se usa el primero.`,
    );
  }

  return group.options
    .map((option) => ({ option, quantity: optionQuantities[option.id] ?? 0 }))
    .filter(({ quantity }) => quantity > 0)
    .map(({ option, quantity }) => ({
      productId: product.id,
      variantOptionId: option.id,
      variantOptionName: option.name,
      productName: product.name,
      photoUrl: product.photoUrl,
      unitPriceCents: product.priceCents + option.priceDeltaCents,
      quantity,
    }));
}

export function buildCartLineForSimpleProduct(product: Product, quantity: number): NewCartLine[] {
  if (quantity <= 0) return [];
  return [
    {
      productId: product.id,
      productName: product.name,
      photoUrl: product.photoUrl,
      unitPriceCents: product.priceCents,
      quantity,
    },
  ];
}
