import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { itemCount, subtotalCents, useCartStore } from '@/features/cart/store/cartStore';
import { ApiRequestError } from '@/shared/api';
import { colors, EmptyState, ErrorState, radius, Skeleton, spacing, Text } from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils';
import type { Product } from '../api/types';
import { AvatarFallback } from '../components/AvatarFallback';
import { ClosedPill } from '../components/ClosedPill';
import { FloatingBackButton } from '../components/FloatingBackButton';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { RatingBadge } from '../components/RatingBadge';
import { useBusiness } from '../hooks/useBusiness';
import { useBusinessProducts } from '../hooks/useBusinessProducts';
import { useQuickAddToCart } from '../hooks/useQuickAddToCart';

const SKELETON_KEYS = ['s0', 's1', 's2', 's3'];
const COVER_HEIGHT = 150;
const LOGO_SIZE = 72;

export function BusinessDetailScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const businessQuery = useBusiness(businessId);
  const productsQuery = useBusinessProducts(businessId);

  const cartBusinessId = useCartStore((state) => state.businessId);
  const cartLines = useCartStore((state) => state.lines);
  const showCartBar = cartBusinessId === businessId && cartLines.length > 0;

  // businessQuery.data puede no estar listo todavía -- el quick-add real
  // solo se dispara una vez que la lista de productos ya está renderizada,
  // momento en el que el negocio ya cargó.
  const quickAddOrOpen = useQuickAddToCart(businessId, businessQuery.data?.name ?? '');

  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [productsQuery.data],
  );

  const handleEndReached = useCallback(() => {
    if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
      productsQuery.fetchNextPage();
    }
  }, [productsQuery]);

  const renderItem = useCallback<ListRenderItem<Product>>(
    ({ item }) => (
      <ProductCard
        product={item}
        onPress={() => router.push(`/business/${businessId}/product/${item.id}`)}
        onQuickAdd={quickAddOrOpen}
      />
    ),
    [businessId, router, quickAddOrOpen],
  );

  if (businessQuery.isPending) {
    return (
      <View style={styles.screen}>
        <FloatingBackButton />
        <View style={[styles.cover, styles.coverSkeleton]} />
        <View style={styles.infoBlock}>
          <Skeleton
            width={LOGO_SIZE}
            height={LOGO_SIZE}
            radius={radius.xl}
            style={styles.logoSkeleton}
          />
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={14} />
        </View>
      </View>
    );
  }

  if (businessQuery.isError) {
    const kind =
      businessQuery.error instanceof ApiRequestError ? businessQuery.error.error.kind : undefined;
    return (
      <View style={styles.screen}>
        <FloatingBackButton />
        <ErrorState
          message={kind === 'notFound' ? 'Este negocio ya no está disponible.' : undefined}
          onRetry={() => businessQuery.refetch()}
          retrying={businessQuery.isRefetching}
        />
      </View>
    );
  }

  const business = businessQuery.data;

  return (
    <View style={styles.screen}>
      <FloatingBackButton />
      <FlashList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.cover} />
            <View style={styles.infoBlock}>
              <View style={styles.logoWrapper}>
                <AvatarFallback uri={business.logoUrl} label={business.name} size={LOGO_SIZE} />
              </View>
              <View style={styles.titleRow}>
                <Text variant="titleSm">{business.name}</Text>
                {!business.isOpen ? <ClosedPill /> : null}
              </View>
              <View style={styles.meta}>
                <RatingBadge avgRating={business.avgRating} reviewCount={business.reviewCount} />
                <Text variant="bodySm" color="secondary">
                  {' '}
                  · {business.prepTimeMinutes} min · Envío{' '}
                  {formatMoneyCents(business.deliveryFeeCents)}
                </Text>
              </View>
              <View style={styles.minOrderBanner}>
                <Text variant="bodySm" style={styles.minOrderText}>
                  Mínimo de compra {formatMoneyCents(business.minOrderCents)}
                </Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          productsQuery.isPending ? (
            <View style={styles.listContent}>
              {SKELETON_KEYS.map((key) => (
                <ProductCardSkeleton key={key} />
              ))}
            </View>
          ) : productsQuery.isError ? (
            <ErrorState
              onRetry={() => productsQuery.refetch()}
              retrying={productsQuery.isRefetching}
            />
          ) : (
            <EmptyState
              title="Este negocio todavía no tiene productos"
              description="Volvé más tarde para ver su catálogo."
            />
          )
        }
        ListFooterComponent={
          productsQuery.isFetchingNextPage ? (
            <ActivityIndicator style={styles.footerLoader} color={colors.brand.default} />
          ) : null
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
      />
      {showCartBar ? (
        <Pressable
          onPress={() => router.push('/cart')}
          style={[styles.cartBar, { marginBottom: insets.bottom + spacing.md }]}
          accessibilityRole="button"
          accessibilityLabel={`Ver mi carrito, ${itemCount(cartLines)} ítems, ${formatMoneyCents(subtotalCents(cartLines))}`}
        >
          <View style={styles.cartBarLeft}>
            <View style={styles.cartBarCount}>
              <Text variant="bodySm" color="onBrand" style={styles.cartBarCountText}>
                {itemCount(cartLines)}
              </Text>
            </View>
            <Text variant="subtitle" color="onBrand">
              Ver mi carrito
            </Text>
          </View>
          <Text variant="subtitle" color="onBrand">
            {formatMoneyCents(subtotalCents(cartLines))}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.default,
  },
  cover: {
    height: COVER_HEIGHT,
    width: '100%',
    backgroundColor: colors.brand.tint,
  },
  coverSkeleton: {
    backgroundColor: colors.surface.mutedAlt,
  },
  infoBlock: {
    marginTop: -38,
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  logoWrapper: {
    borderRadius: radius.xl,
    borderWidth: 3,
    borderColor: colors.surface.default,
    backgroundColor: colors.surface.default,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  logoSkeleton: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  minOrderBanner: {
    backgroundColor: colors.brand.tint,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  minOrderText: {
    color: colors.brand.dark,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
  },
  cartBar: {
    marginHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.brand.default,
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cartBarCount: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBarCountText: {
    fontWeight: '700',
  },
});
