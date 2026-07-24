import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackIcon } from '@/features/marketplace/components/icons';
import { useBottomInset } from '@/shared/hooks';
import { colors, radius, spacing, Text } from '@/shared/ui';
import { PRIVACY_POLICY_CONTACT_EMAIL } from '../data/privacyPolicy';
import { useDeleteAccount } from '../hooks/useDeleteAccount';

export function DeleteAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = useBottomInset(spacing.lg);
  const { canDelete, isPending, error, deleteAccount } = useDeleteAccount();

  function handleConfirm() {
    Alert.alert(
      'Eliminar tu cuenta',
      'Esta acción no se puede deshacer. ¿Seguro que querés eliminar tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteAccount() },
      ],
    );
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
        <Text variant="titleMd" style={styles.headerTitle}>
          Eliminar cuenta
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {canDelete ? (
          <>
            <Text variant="bodyMd" color="secondary" style={styles.paragraph}>
              Al eliminar tu cuenta perdés el acceso y tus direcciones guardadas.
            </Text>
            <Text variant="bodyMd" color="secondary" style={styles.paragraph}>
              Tu historial de pedidos se conserva, pero desvinculado de tu identidad de acceso, por
              razones contables y legales.
            </Text>
            <Pressable
              onPress={() => router.push('/privacy')}
              accessibilityRole="button"
              style={styles.privacyLink}
            >
              <Text variant="bodySm" color="brand">
                Ver la política de privacidad
              </Text>
            </Pressable>
            <Text variant="bodyMd" color="secondary" style={styles.paragraph}>
              Podés volver a registrarte con el mismo email cuando quieras.
            </Text>
            {error ? (
              <Text variant="bodySm" color="danger" style={styles.paragraph}>
                {error}
              </Text>
            ) : null}
          </>
        ) : (
          <Text variant="bodyMd" color="secondary" style={styles.paragraph}>
            No podemos procesar el borrado en este momento. Escribinos a{' '}
            {PRIVACY_POLICY_CONTACT_EMAIL} y te ayudamos.
          </Text>
        )}
      </ScrollView>

      {canDelete ? (
        <View style={[styles.footer, { paddingBottom: bottomInset }]}>
          <Pressable
            onPress={handleConfirm}
            disabled={isPending}
            accessibilityRole="button"
            accessibilityLabel="Eliminar mi cuenta"
            style={[styles.deleteButton, isPending && styles.deleteButtonDisabled]}
          >
            {isPending ? (
              <ActivityIndicator color={colors.text.onBrand} />
            ) : (
              <Text variant="subtitle" color="onBrand">
                Eliminar mi cuenta
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  paragraph: {
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  privacyLink: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.surface.default,
  },
  deleteButton: {
    minHeight: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.danger.default,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
});
