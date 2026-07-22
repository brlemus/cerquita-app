import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { useCartStore, wouldReplaceCart } from '@/features/cart/store/cartStore';
import type { Product } from '../api/types';
import { buildCartLineForSimpleProduct } from '../utils/buildCartLines';

/**
 * Compartido entre `ProductCard` (catálogo) y las sugerencias de
 * `CartScreen`: mismo guard de cambio de negocio que `ProductDetailScreen`
 * -- necesario acá también, el catálogo de un negocio puede verse con el
 * carrito lleno de OTRO negocio.
 */
export function useQuickAddToCart(businessId: string, businessName: string) {
  const router = useRouter();

  return function quickAddOrOpen(product: Product) {
    if (product.variantGroups.length > 0) {
      router.push(`/business/${businessId}/product/${product.id}`);
      return;
    }

    const lines = buildCartLineForSimpleProduct(product, 1);
    if (lines.length === 0) return;

    const addLines = () => {
      lines.forEach((line) => useCartStore.getState().addLine(businessId, businessName, line));
    };

    if (wouldReplaceCart(useCartStore.getState(), businessId)) {
      Alert.alert('Nuevo negocio', `¿Vaciar el carrito y empezar en ${businessName}?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar y agregar',
          style: 'destructive',
          onPress: () => {
            useCartStore.getState().clearCart();
            addLines();
          },
        },
      ]);
    } else {
      addLines();
    }
  };
}
