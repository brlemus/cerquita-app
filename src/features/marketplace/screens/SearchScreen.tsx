import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDebounce } from '@/shared/hooks';
import { colors, EmptyState, ErrorState, radius, spacing, Text } from '@/shared/ui';
import type { Business } from '../api/types';
import { BusinessCard } from '../components/BusinessCard';
import { BusinessCardSkeleton } from '../components/BusinessCardSkeleton';
import { BackIcon, SearchIcon } from '../components/icons';
import { useBusinesses } from '../hooks/useBusinesses';
import { usePlatformCategories } from '../hooks/usePlatformCategories';

const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_KEYS = ['s0', 's1', 's2', 's3'];

/**
 * FlashList NO va dentro de KeyboardAwareScreen -- anidar una lista
 * virtualizada en un ScrollView anula la virtualización. Header propio +
 * keyboardShouldPersistTaps/keyboardDismissMode pasados directo al FlashList.
 */
export function SearchScreen() {
  const router = useRouter();
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebounce(rawSearch, SEARCH_DEBOUNCE_MS);
  const hasQuery = search.trim().length > 0;

  const categoriesQuery = usePlatformCategories();
  const categoryNameById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name])),
    [categoriesQuery.data],
  );

  const businessesQuery = useBusinesses({ search, enabled: hasQuery });
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

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.backButton}
        >
          <BackIcon />
        </Pressable>
        <Text variant="titleLg">Buscar</Text>
      </View>

      <View style={styles.searchBar}>
        <SearchIcon />
        <TextInput
          value={rawSearch}
          onChangeText={setRawSearch}
          placeholder="Buscar negocios"
          placeholderTextColor={colors.text.secondary}
          style={styles.input}
          autoFocus
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      {!hasQuery ? (
        <EmptyState
          title="Buscá tu negocio favorito"
          description="Escribí el nombre de un negocio para empezar."
        />
      ) : businessesQuery.isPending ? (
        <View style={styles.listContent}>
          {SKELETON_KEYS.map((key) => (
            <BusinessCardSkeleton key={key} />
          ))}
        </View>
      ) : businessesQuery.isError ? (
        <ErrorState
          onRetry={() => businessesQuery.refetch()}
          retrying={businessesQuery.isRefetching}
        />
      ) : (
        <FlashList
          data={businesses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <EmptyState
              title={`Sin resultados para "${search}"`}
              description="Probá con otro nombre."
            />
          }
          ListFooterComponent={
            businessesQuery.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footerLoader} color={colors.brand.default} />
            ) : null
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
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
    gap: spacing.md,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.subtle,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface.subtle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
  },
});
