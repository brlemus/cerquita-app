import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useBusinessProducts } from '@/features/marketplace/hooks/useBusinessProducts';
import { useQuickAddToCart } from '@/features/marketplace/hooks/useQuickAddToCart';
import { colors, QuickAddButton, radius, spacing, Text } from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils';

export type CartSuggestionsProps = {
  businessId: string;
  businessName: string;
  /** Productos ya en el carrito (por id) -- no tiene sentido sugerirlos de nuevo. */
  excludeProductIds: string[];
};

const MAX_SUGGESTIONS = 6;

/** Otros productos del mismo negocio, con quick-add -- mismo guard de cambio de negocio que ProductCard. */
export function CartSuggestions({
  businessId,
  businessName,
  excludeProductIds,
}: CartSuggestionsProps) {
  const productsQuery = useBusinessProducts(businessId);
  const quickAddOrOpen = useQuickAddToCart(businessId, businessName);

  const excluded = new Set(excludeProductIds);
  const suggestions = (productsQuery.data?.pages.flatMap((page) => page.data) ?? [])
    .filter((product) => !excluded.has(product.id))
    .slice(0, MAX_SUGGESTIONS);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text variant="subtitle" style={styles.title}>
        Sugerencias del negocio
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {suggestions.map((product) => (
          <View key={product.id} style={styles.card}>
            <View style={styles.thumbnailWrapper}>
              {product.photoUrl ? (
                <Image
                  source={{ uri: product.photoUrl }}
                  style={styles.thumbnail}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailFallback]} />
              )}
              <QuickAddButton onPress={() => quickAddOrOpen(product)} style={styles.quickAdd} />
            </View>
            <Text variant="bodySm" numberOfLines={1} style={styles.name}>
              {product.name}
            </Text>
            <Text variant="bodySm" color="brand" style={styles.price}>
              {formatMoneyCents(product.priceCents)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 120;

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
  },
  title: {
    marginBottom: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
  card: {
    width: CARD_WIDTH,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: CARD_WIDTH,
    height: 90,
    borderRadius: radius.md,
  },
  thumbnailFallback: {
    backgroundColor: colors.surface.subtle,
  },
  quickAdd: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
  name: {
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  price: {
    fontWeight: '700',
  },
});
