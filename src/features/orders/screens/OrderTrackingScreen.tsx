import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackIcon } from '@/features/marketplace/components/icons';
import { useBusiness } from '@/features/marketplace/hooks/useBusiness';
import { OrderReviewCard } from '@/features/reviews/components/OrderReviewCard';
import { ApiRequestError } from '@/shared/api';
import { useBottomInset } from '@/shared/hooks';
import { Button, colors, ErrorState, radius, spacing, Text } from '@/shared/ui';
import { OrderStatusStepper } from '../components/OrderStatusStepper';
import { useCancelOrder } from '../hooks/useCancelOrder';
import { useOrder } from '../hooks/useOrder';
import { useOrderStatus } from '../hooks/useOrderStatus';
import { classifyCancelConflict } from '../utils/classifyCancelConflict';
import { shortOrderId, statusLabel } from '../utils/orderStatus';

const CANCEL_CONFLICT_MESSAGE: Record<ReturnType<typeof classifyCancelConflict>, string> = {
  alreadyDelivered: 'Tu pedido ya fue entregado.',
  alreadyCancelled: 'Tu pedido ya estaba cancelado.',
  statusChanged: 'El estado de tu pedido cambió. Actualizamos la pantalla.',
  unknown: 'No pudimos cancelar tu pedido. Actualizamos la pantalla con el estado real.',
};

/**
 * Fuente de verdad del pedido completo: `useOrder` (una vez). El estado
 * mostrado prioriza `useOrderStatus` (polling) sobre lo que trajo
 * `useOrder`, sin escribir el cache a mano -- ver
 * docs/phases/phase-5-tracking.md.
 *
 * `ScrollView` + footer envueltos en `KeyboardAvoidingView behavior="padding"`
 * (header queda afuera, no tiene inputs): mismo mecanismo que ya prueba
 * `KeyboardAwareScreen` en Login/`AddressFormScreen` -- con edge-to-edge,
 * `adjustResize` no es confiable en Android (docs/phases/
 * chore-brand-v2-login-splash.md), `padding` funciona en ambas plataformas.
 * No se reusa `KeyboardAwareScreen` tal cual porque no tiene slot de footer
 * y esta pantalla combina header fijo + scroll + footer fijo (cancelar/volver),
 * nunca simultáneo con la reseña (que solo aparece en `ENTREGADO`, cuando
 * `canCancel` ya es `false`).
 */
export function OrderTrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = useBottomInset(spacing.lg);
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const orderQuery = useOrder(orderId);
  const statusQuery = useOrderStatus(orderId);
  const cancelMutation = useCancelOrder(orderId);

  const order = orderQuery.data;
  const businessQuery = useBusiness(order?.businessId ?? null);

  const effectiveStatus = statusQuery.data?.status ?? order?.status;
  const effectiveEta = statusQuery.data?.etaMinutes ?? order?.etaMinutes;

  if (orderQuery.isPending) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.brand.default} />
      </View>
    );
  }

  if (orderQuery.isError || !order || !effectiveStatus) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ErrorState onRetry={() => orderQuery.refetch()} retrying={orderQuery.isRefetching} />
      </View>
    );
  }

  const shortId = shortOrderId(order.id);
  const isCancelled = effectiveStatus === 'CANCELADO';
  const canCancel = effectiveStatus === 'PENDIENTE';

  function handleCancel() {
    Alert.alert('Cancelar pedido', '¿Seguro que querés cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () => {
          cancelMutation.mutate(undefined, {
            onError: (error) => {
              if (error instanceof ApiRequestError && error.error.kind === 'conflict') {
                const kind = classifyCancelConflict(error.error.details);
                Alert.alert('No se pudo cancelar', CANCEL_CONFLICT_MESSAGE[kind]);
              }
            },
          });
        },
      },
    ]);
  }

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
        <Text variant="titleMd">Seguimiento</Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={[styles.heroCard, isCancelled && styles.heroCardCancelled]}>
            <Text
              variant="bodySm"
              color={isCancelled ? 'danger' : 'brand'}
              style={styles.centerText}
            >
              {statusLabel(effectiveStatus)}
            </Text>
            {!isCancelled && effectiveEta !== undefined ? (
              <Text variant="titleLg" style={styles.centerText}>
                ~{effectiveEta} min
              </Text>
            ) : null}
            <Text
              variant="bodySm"
              color={isCancelled ? 'danger' : 'brand'}
              style={styles.centerText}
            >
              Pedido #{shortId}
              {businessQuery.data ? ` · ${businessQuery.data.name}` : ''}
            </Text>
          </View>

          {!isCancelled ? (
            <View style={styles.stepperSection}>
              <OrderStatusStepper status={effectiveStatus} />
            </View>
          ) : null}

          {effectiveStatus === 'ENTREGADO' ? (
            <OrderReviewCard orderId={order.id} review={order.review} />
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: bottomInset }]}>
          {canCancel ? (
            <Pressable
              onPress={handleCancel}
              disabled={cancelMutation.isPending}
              style={styles.cancelButton}
              accessibilityRole="button"
            >
              <Text variant="bodyMd" color="danger">
                {cancelMutation.isPending ? 'Cancelando…' : 'Cancelar pedido'}
              </Text>
            </Pressable>
          ) : null}
          <Button title="Volver al inicio" size="lg" onPress={() => router.replace('/')} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.default,
  },
  flex: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface.default,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.brand.tint,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: 4,
  },
  heroCardCancelled: {
    backgroundColor: colors.surface.subtle,
  },
  centerText: {
    textAlign: 'center',
  },
  stepperSection: {
    marginTop: spacing.xxl,
    paddingLeft: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface.default,
    gap: spacing.sm,
  },
  cancelButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
