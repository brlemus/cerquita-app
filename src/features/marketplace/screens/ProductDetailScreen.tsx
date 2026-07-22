import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCartStore, wouldReplaceCart } from '@/features/cart/store/cartStore';
import { Button, colors, ErrorState, spacing, Stepper, Text } from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { useBusiness } from '../hooks/useBusiness';
import { useCachedProduct } from '../hooks/useCachedProduct';
import { buildCartLineForSimpleProduct, buildCartLinesForVariants } from '../utils/buildCartLines';

const HERO_HEIGHT = 240;

/**
 * Selector "cantidad por opción" (solo primer grupo de variantes, ver
 * docs/phases/phase-3-cart.md) o stepper simple sin variantes. No pega a
 * la red para el producto (cache de la infinite query de Business
 * Detail); sí resuelve el negocio vía useBusiness para el nombre que
 * necesita el diálogo de cambio de negocio y la línea del carrito.
 */
export function ProductDetailScreen() {
  const { businessId, productId } = useLocalSearchParams<{
    businessId: string;
    productId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const product = useCachedProduct(businessId, productId);
  const businessQuery = useBusiness(businessId);
  const business = businessQuery.data;

  const hasVariants = !!product && product.variantGroups.length > 0;
  const group = product?.variantGroups[0];

  const [optionQty, setOptionQty] = useState<Record<string, number>>({});
  const [simpleQty, setSimpleQty] = useState(1);

  if (!product) {
    return (
      <View style={styles.screen}>
        <FloatingBackButton />
        <ErrorState message="No encontramos este producto." onRetry={() => router.back()} />
      </View>
    );
  }

  const multiTotal = hasVariants
    ? Object.values(optionQty).reduce((total, qty) => total + qty, 0)
    : 0;
  const multiSum = hasVariants
    ? (group?.options ?? []).reduce(
        (total, option) =>
          total + (product.priceCents + option.priceDeltaCents) * (optionQty[option.id] ?? 0),
        0,
      )
    : 0;

  const addLabel = hasVariants
    ? multiTotal > 0
      ? `Agregar ${multiTotal} ${multiTotal === 1 ? 'ítem' : 'ítems'} · ${formatMoneyCents(multiSum)}`
      : 'Elegí al menos una opción'
    : `Agregar · ${formatMoneyCents(product.priceCents * simpleQty)}`;

  const addDisabled = !business || (hasVariants && multiTotal === 0);

  function handleAddToCart() {
    if (!business) return;

    const lines = hasVariants
      ? buildCartLinesForVariants(product!, optionQty)
      : buildCartLineForSimpleProduct(product!, simpleQty);
    if (lines.length === 0) return;

    const addAll = () => {
      lines.forEach((line) => useCartStore.getState().addLine(businessId, business.name, line));
      router.back();
    };

    if (wouldReplaceCart(useCartStore.getState(), businessId)) {
      Alert.alert('Nuevo negocio', `¿Vaciar el carrito y empezar en ${business.name}?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar y agregar',
          style: 'destructive',
          onPress: () => {
            useCartStore.getState().clearCart();
            addAll();
          },
        },
      ]);
    } else {
      addAll();
    }
  }

  return (
    <View style={styles.screen}>
      <FloatingBackButton />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xxxl + 72,
        }}
      >
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

          {hasVariants && group ? (
            <View style={styles.variantSection}>
              <View style={styles.variantHeader}>
                <Text variant="subtitle">{group.name} · cantidad por opción</Text>
                <Text variant="bodySm" color="secondary">
                  {formatMoneyCents(product.priceCents)} c/u
                </Text>
              </View>
              {group.options.map((option) => {
                const soldOut = option.stock === 0 || !option.isActive;
                const qty = optionQty[option.id] ?? 0;
                return (
                  <View key={option.id} style={styles.optionRow}>
                    <View style={styles.optionInfo}>
                      <Text variant="bodyLg">
                        {option.name}
                        {option.priceDeltaCents !== 0
                          ? ` +${formatMoneyCents(option.priceDeltaCents)}`
                          : ''}
                      </Text>
                      {soldOut ? (
                        <Text variant="bodySm" color="secondary">
                          Agotado
                        </Text>
                      ) : null}
                    </View>
                    {!soldOut ? (
                      <Stepper
                        value={qty}
                        atMax={qty >= option.stock}
                        onIncrement={() =>
                          setOptionQty((prev) => ({
                            ...prev,
                            [option.id]: Math.min((prev[option.id] ?? 0) + 1, option.stock),
                          }))
                        }
                        onDecrement={() =>
                          setOptionQty((prev) => ({
                            ...prev,
                            [option.id]: Math.max((prev[option.id] ?? 0) - 1, 0),
                          }))
                        }
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.qtyRow}>
              <Text variant="subtitle">Cantidad</Text>
              <Stepper
                value={simpleQty}
                atMax={product.stock !== null && simpleQty >= product.stock}
                onIncrement={() =>
                  setSimpleQty((qty) =>
                    product.stock !== null ? Math.min(qty + 1, product.stock) : qty + 1,
                  )
                }
                onDecrement={() => setSimpleQty((qty) => Math.max(qty - 1, 1))}
              />
            </View>
          )}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Button title={addLabel} onPress={handleAddToCart} disabled={addDisabled} size="lg" />
      </View>
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
  variantSection: {
    marginTop: spacing.md,
  },
  variantHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  qtyRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface.default,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
});
