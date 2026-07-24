import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, QuickAddButton, radius, spacing, Text } from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils';
import type { Product } from '../api/types';

export type ProductCardProps = {
  product: Product;
  onPress: () => void;
  /** Solo se muestra el "+" si el producto no tiene variantes -- con variantes hay que abrir el detalle. */
  onQuickAdd?: (product: Product) => void;
};

export const ProductCard = memo(function ProductCard({
  product,
  onPress,
  onQuickAdd,
}: ProductCardProps) {
  const hasVariants = product.variantGroups.length > 0;
  const description = product.description ?? (hasVariants ? 'Varias opciones disponibles' : null);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={product.name}
    >
      {product.photoUrl ? (
        <Image
          source={{ uri: product.photoUrl }}
          style={styles.image}
          cachePolicy="memory-disk"
          contentFit="cover"
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <View style={styles.info}>
        {product.catalogCategoryName ? (
          <View style={styles.categoryPill}>
            <Text variant="caption" color="brand" numberOfLines={1} style={styles.categoryPillText}>
              {product.catalogCategoryName}
            </Text>
          </View>
        ) : null}
        <Text variant="bodyLg" numberOfLines={1}>
          {product.name}
        </Text>
        {description ? (
          <Text variant="bodySm" color="secondary" numberOfLines={1}>
            {description}
          </Text>
        ) : null}
        <Text variant="subtitle" color="brand">
          {formatMoneyCents(product.priceCents)}
        </Text>
      </View>
      {!hasVariants && onQuickAdd ? <QuickAddButton onPress={() => onQuickAdd(product)} /> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  pressed: {
    backgroundColor: colors.surface.subtle,
  },
  image: {
    width: 74,
    height: 74,
    borderRadius: radius.lg,
  },
  imageFallback: {
    backgroundColor: colors.surface.subtle,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface.tint,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: 2,
  },
  categoryPillText: {
    color: colors.brand.dark,
  },
});
