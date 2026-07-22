import { useAuth } from '@clerk/clerk-expo';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { CartIconButton } from '@/features/cart/components/CartIconButton';
import { useCartStore } from '@/features/cart/store/cartStore';
import { colors, EmptyState, ErrorState, radius, spacing, Text } from '@/shared/ui';
import type { Business } from '../api/types';
import { BusinessCard } from '../components/BusinessCard';
import { BusinessCardSkeleton } from '../components/BusinessCardSkeleton';
import { CategoryChips } from '../components/CategoryChips';
import { SearchIcon } from '../components/icons';
import { useBusinesses } from '../hooks/useBusinesses';
import { usePlatformCategories } from '../hooks/usePlatformCategories';

const SKELETON_KEYS = ['s0', 's1', 's2', 's3', 's4', 's5'];

function SignOutIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path
        d="M7 2H3.5a1 1 0 00-1 1v12a1 1 0 001 1H7M11.5 12.5L16 8l-4.5-4.5M16 8H6.5"
        stroke={colors.text.primary}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const categoriesQuery = usePlatformCategories();
  const businessesQuery = useBusinesses({ platformCategoryId: categoryId });

  const categories = categoriesQuery.data ?? [];
  const categoryNameById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name])),
    [categoriesQuery.data],
  );
  const businesses = useMemo(
    () => businessesQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [businessesQuery.data],
  );

  const handleEndReached = useCallback(() => {
    if (businessesQuery.hasNextPage && !businessesQuery.isFetchingNextPage) {
      businessesQuery.fetchNextPage();
    }
  }, [businessesQuery]);

  const renderItem = useCallback<ListRenderItem<Business>>(
    ({ item }) => (
      <BusinessCard
        business={item}
        categoryName={categoryNameById.get(item.platformCategoryId)}
        onPress={() => router.push(`/business/${item.id}`)}
      />
    ),
    [categoryNameById, router],
  );

  const chips = (
    <CategoryChips categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push('/search')}
          style={styles.searchBar}
          accessibilityRole="button"
          accessibilityLabel="Buscar negocios"
        >
          <SearchIcon />
          <Text color="secondary">Buscar negocios</Text>
        </Pressable>
        <CartIconButton />
        {/* temporal hasta Fase 7 (Profile) -- único punto de logout hasta entonces */}
        <Pressable
          onPress={() => {
            // el carrito es del usuario que sale de sesión -- no debe sobrevivir para el próximo login
            useCartStore.getState().clearCart();
            signOut();
          }}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <SignOutIcon />
        </Pressable>
      </View>

      {businessesQuery.isPending ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {chips}
          {SKELETON_KEYS.map((key) => (
            <BusinessCardSkeleton key={key} />
          ))}
        </ScrollView>
      ) : businessesQuery.isError ? (
        <>
          {chips}
          <ErrorState
            onRetry={() => businessesQuery.refetch()}
            retrying={businessesQuery.isRefetching}
          />
        </>
      ) : (
        <FlashList
          data={businesses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={chips}
          ListEmptyComponent={
            <EmptyState
              title={
                categoryId ? 'Sin negocios en esta categoría' : 'No hay negocios en tu zona todavía'
              }
              description={categoryId ? 'Probá con otra categoría.' : 'Volvé a intentar más tarde.'}
            />
          }
          ListFooterComponent={
            businessesQuery.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footerLoader} color={colors.brand.default} />
            ) : null
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshing={businessesQuery.isRefetching && !businessesQuery.isFetchingNextPage}
          onRefresh={() => businessesQuery.refetch()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    backgroundColor: colors.surface.subtle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
  },
});
