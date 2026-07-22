import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, ErrorState, radius, spacing, Text } from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { useCachedProduct } from '../hooks/useCachedProduct';

const HERO_HEIGHT = 240;

/**
 * Solo lectura -- sin selector de variantes, sin stepper, sin "Agregar"
 * (eso es Fase 3). No pega a la red: el producto ya está en cache de la
 * infinite query de productos del negocio (ver useCachedProduct).
 */
export function ProductDetailScreen() {
  const { businessId, productId } = useLocalSearchParams<{
    businessId: string;
    productId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const product = useCachedProduct(businessId, productId);

  if (!product) {
    return (
      <View style={styles.screen}>
        <FloatingBackButton />
        <ErrorState message="No encontramos este producto." onRetry={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FloatingBackButton />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        {product.photoUrl ? (
          <Image
            source={{ uri: product.photoUrl }}
            style={styles.hero}
            cachePolicy="memory-disk"
            contentFit="cover"
          />
        ) : (
          <View style={[styles.hero, styles.heroFallback]} />
        )}
        <View style={styles.content}>
          <Text variant="titleMd">{product.name}</Text>
          {product.description ? (
            <Text variant="bodyMd" color="secondary">
              {product.description}
            </Text>
          ) : null}
          <Text variant="titleSm" color="brand">
            {formatMoneyCents(product.priceCents)}
          </Text>

          {product.variantGroups.map((group) => (
            <View key={group.id} style={styles.variantGroup}>
              <Text variant="subtitle">{group.name}</Text>
              <View style={styles.optionsRow}>
                {group.options.map((option) => (
                  <View key={option.id} style={styles.optionChip}>
                    <Text variant="bodyMd">
                      {option.name}
                      {option.priceDeltaCents !== 0
                        ? ` (+${formatMoneyCents(option.priceDeltaCents)})`
                        : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.default,
  },
  hero: {
    height: HERO_HEIGHT,
    width: '100%',
  },
  heroFallback: {
    backgroundColor: colors.surface.subtle,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  variantGroup: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
