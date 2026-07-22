import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackIcon } from '@/features/marketplace/components/icons';
import {
  Button,
  colors,
  EmptyState,
  ErrorState,
  radius,
  Skeleton,
  spacing,
  Text,
} from '@/shared/ui';
import { ChevronRightIcon, PinIcon } from '../components/icons';
import type { Address } from '../api/types';
import { useAddresses } from '../hooks/useAddresses';

/**
 * Modo gestión (sin `returnTo`, llegada desde Home/Perfil): tocar una fila
 * abre su editor. Modo selección (`returnTo` presente, llegada desde
 * Checkout): tocar una fila navega de vuelta con `?addressId=`.
 */
export function AddressListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const addressesQuery = useAddresses();

  function handleRowPress(address: Address) {
    if (returnTo) {
      // Ver justificación de `as never` en AddressFormScreen.
      router.replace(`${returnTo}?addressId=${address.id}` as never);
    } else {
      router.push(`/addresses/${address.id}/edit`);
    }
  }

  function handleAddNew() {
    // query armado en runtime -- expo-router no puede tipar el sufijo
    // dinámico, `as never` es el escape hatch (nunca `any`).
    const query = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    router.push(`/addresses/new${query}` as never);
  }

  const addresses = addressesQuery.data?.data ?? [];

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <BackIcon />
        </Pressable>
        <Text variant="titleMd" style={styles.headerTitle}>
          {returnTo ? 'Elegí una dirección' : 'Mis direcciones'}
        </Text>
        <Pressable
          onPress={handleAddNew}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Agregar dirección"
        >
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path
              d="M12 5v14M5 12h14"
              stroke={colors.text.onBrand}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>
      </View>

      {addressesQuery.isPending ? (
        <View style={styles.listContent}>
          <Skeleton width="100%" height={72} />
          <Skeleton width="100%" height={72} />
        </View>
      ) : addressesQuery.isError ? (
        <ErrorState
          onRetry={() => addressesQuery.refetch()}
          retrying={addressesQuery.isRefetching}
        />
      ) : addresses.length === 0 ? (
        <EmptyState
          title="Todavía no tenés direcciones"
          description="Agregá una para poder recibir tus pedidos."
          action={<Button title="Agregar dirección" onPress={handleAddNew} />}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {addresses.map((address) => (
            <Pressable
              key={address.id}
              style={styles.row}
              onPress={() => handleRowPress(address)}
              accessibilityRole="button"
            >
              <PinIcon />
              <View style={styles.rowInfo}>
                <View style={styles.rowTitleLine}>
                  {address.label ? <Text variant="bodyLg">{address.label}</Text> : null}
                  {address.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Text variant="caption" color="brand">
                        Predeterminada
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text variant="bodyMd" numberOfLines={1}>
                  {address.line}
                </Text>
                {address.instructions ? (
                  <Text variant="bodySm" color="secondary" numberOfLines={1}>
                    {address.instructions}
                  </Text>
                ) : null}
              </View>
              <ChevronRightIcon />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
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
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.brand.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  defaultBadge: {
    backgroundColor: colors.brand.tint,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
