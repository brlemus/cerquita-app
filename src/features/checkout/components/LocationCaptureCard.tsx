import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { colors, PinIcon, radius, spacing, Text } from '@/shared/ui';
import type { UseAddressLocationResult } from '../hooks/useAddressLocation';

export type LocationCaptureCardProps = {
  location: UseAddressLocationResult;
};

/**
 * Estados: idle (pedir permiso en contexto) -> requesting (spinner) ->
 * resolved (confirmación, distinta según `source`) -- o manual (permiso
 * negado, se revela el resto del formulario; el picker de departamento lo
 * dispara el submit de AddressFormScreen, no esta tarjeta).
 */
export function LocationCaptureCard({ location }: LocationCaptureCardProps) {
  if (location.status === 'requesting') {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.brand.default} />
        <Text variant="bodyMd" color="secondary">
          Buscando tu ubicación…
        </Text>
      </View>
    );
  }

  if (location.status === 'resolved') {
    return (
      <View style={styles.card}>
        <PinIcon />
        <View style={styles.resolvedText}>
          {location.source === 'existing' ? (
            <>
              <Text variant="bodyMd">Ubicación guardada</Text>
              <Pressable onPress={location.requestGps} accessibilityRole="button">
                <Text variant="bodySm" color="brand">
                  Actualizar con GPS
                </Text>
              </Pressable>
            </>
          ) : location.source === 'gps' ? (
            <Text variant="bodyMd">
              📍 Ubicación detectada
              {location.reverseGeocodedLine ? `: ${location.reverseGeocodedLine}` : ''}
            </Text>
          ) : location.source === 'geocodedLine' ? (
            <Text variant="bodyMd">📍 Ubicación aproximada encontrada</Text>
          ) : (
            <Text variant="bodyMd" color="secondary">
              Ubicación aproximada — tu referencia guía la entrega al repartidor
            </Text>
          )}
        </View>
      </View>
    );
  }

  if (location.status === 'manual') {
    return (
      <View style={styles.card}>
        <PinIcon color={colors.text.secondary} />
        <View style={styles.resolvedText}>
          <Text variant="bodySm" color="secondary">
            Sin ubicación por GPS. Contanos cómo llegar abajo — vamos a ubicarte con eso.
          </Text>
          <Pressable
            onPress={location.canAskPermissionAgain ? location.requestGps : location.openSettings}
            accessibilityRole="button"
          >
            <Text variant="bodySm" color="brand">
              {location.canAskPermissionAgain ? 'Reintentar permiso' : 'Abrir ajustes'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <PinIcon />
      <View style={styles.idleText}>
        <Text variant="bodyMd">Para ubicarte en el mapa y calcular tu envío</Text>
        <Pressable
          onPress={location.requestGps}
          accessibilityRole="button"
          style={styles.primaryLink}
        >
          <Text variant="bodySm" color="onBrand" style={styles.primaryLinkText}>
            Usar mi ubicación
          </Text>
        </Pressable>
        <Pressable onPress={location.useManualFallback} accessibilityRole="button">
          <Text variant="bodySm" color="secondary">
            Ingresar manualmente
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: colors.brand.tint,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  idleText: {
    flex: 1,
    gap: spacing.sm,
  },
  resolvedText: {
    flex: 1,
    gap: spacing.xs,
  },
  primaryLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  primaryLinkText: {
    fontWeight: '700',
  },
});
