import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, colors, EmptyState, ErrorState, spacing, Text } from '@/shared/ui';
import type { Order } from '../api/types';
import { OrderRow } from '../components/OrderRow';
import { OrderRowSkeleton } from '../components/OrderRowSkeleton';
import { useOrders } from '../hooks/useOrders';

const SKELETON_KEYS = ['s0', 's1', 's2', 's3', 's4'];

export function OrdersScreen() {
  const router = useRouter();
  const ordersQuery = useOrders();

  // `refetch` cambia de identidad en cada render de la query -- un ref
  // evita que el useCallback de abajo (y por lo tanto la suscripción de
  // useFocusEffect) se recree en cada cambio de estado del fetch/scroll.
  // Se actualiza en un efecto, no durante el render (react-hooks/refs).
  const refetchRef = useRef(ordersQuery.refetch);
  useEffect(() => {
    refetchRef.current = ordersQuery.refetch;
  }, [ordersQuery.refetch]);
  // useFocusEffect corre también en el mount inicial -- se salta esa
  // primera vez porque useInfiniteQuery ya dispara el fetch inicial solo.
  const isFirstFocusRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      refetchRef.current();
    }, []),
  );

  const orders = useMemo(
    () => ordersQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [ordersQuery.data],
  );

  const handleEndReached = useCallback(() => {
    if (ordersQuery.hasNextPage && !ordersQuery.isFetchingNextPage) {
      ordersQuery.fetchNextPage();
    }
  }, [ordersQuery]);

  const renderItem = useCallback<ListRenderItem<Order>>(
    ({ item }) => <OrderRow order={item} onPress={() => router.push(`/orders/${item.id}`)} />,
    [router],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text variant="titleMd" style={styles.header}>
        Mis pedidos
      </Text>

      {ordersQuery.isPending ? (
        <View style={styles.listContent}>
          {SKELETON_KEYS.map((key) => (
            <OrderRowSkeleton key={key} />
          ))}
        </View>
      ) : ordersQuery.isError ? (
        <ErrorState onRetry={() => ordersQuery.refetch()} retrying={ordersQuery.isRefetching} />
      ) : (
        <FlashList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              title="Todavía no hiciste ningún pedido"
              description="Cuando hagas tu primer pedido, lo vas a ver acá."
              action={<Button title="Explorar negocios" onPress={() => router.replace('/')} />}
            />
          }
          ListFooterComponent={
            ordersQuery.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footerLoader} color={colors.brand.default} />
            ) : null
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshing={ordersQuery.isRefetching && !ordersQuery.isFetchingNextPage}
          onRefresh={() => ordersQuery.refetch()}
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
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
  },
});
