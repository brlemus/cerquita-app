import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartIconButton } from '@/features/cart/components/CartIconButton';
import { useAddresses } from '@/features/checkout/hooks/useAddresses';
import { colors, EmptyState, ErrorState, PinIcon, radius, spacing, Text } from '@/shared/ui';
import type { Business } from '../api/types';
import { BusinessCard } from '../components/BusinessCard';
import { BusinessCardSkeleton } from '../components/BusinessCardSkeleton';
import { CategoryChips } from '../components/CategoryChips';
import { ChevronDownIcon, SearchIcon } from '../components/icons';
import { useBusinesses } from '../hooks/useBusinesses';
import { usePlatformCategories } from '../hooks/usePlatformCategories';

const SKELETON_KEYS = ['s0', 's1', 's2', 's3', 's4', 's5'];

export function HomeScreen() {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const categoriesQuery = usePlatformCategories();
  const businessesQuery = useBusinesses({ platformCategoryId: categoryId });
  const addressesQuery = useAddresses();
  const addresses = addressesQuery.data?.data ?? [];
  // Preferencia visual únicamente -- el contrato no soporta orden por
  // cercanía (ver "Paridad con el prototipo"), esto no filtra ni ordena
  // el marketplace.
  const deliverToAddress = addresses.find((address) => address.isDefault) ?? addresses[0];

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
      <Pressable
        onPress={() => router.push('/addresses')}
        style={styles.deliverToRow}
        accessibilityRole="button"
        accessibilityLabel="Cambiar dirección de entrega"
      >
        <PinIcon />
        <View style={styles.deliverToText}>
          <Text variant="caption" color="secondary">
            Entregar en
          </Text>
          <View style={styles.deliverToValue}>
            <Text variant="bodyLg" numberOfLines={1}>
              {deliverToAddress
                ? (deliverToAddress.label ?? deliverToAddress.line)
                : 'Agregar dirección'}
            </Text>
            <ChevronDownIcon />
          </View>
        </View>
      </Pressable>
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
  deliverToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
  deliverToText: {
    flex: 1,
  },
  deliverToValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  listContent: {
    paddingBottom: spacing.xl,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
  },
});
