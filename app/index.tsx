import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, colors, radius, spacing, Text, typography } from '@/shared/ui';
import type { TypographyVariant } from '@/shared/ui';

const TYPE_LABELS: { variant: TypographyVariant; label: string }[] = [
  { variant: 'display', label: 'display · 28' },
  { variant: 'titleLg', label: 'title.lg · 24' },
  { variant: 'titleMd', label: 'title.md · 20' },
  { variant: 'titleSm', label: 'title.sm · 18' },
  { variant: 'subtitle', label: 'subtitle · 16' },
  { variant: 'bodyLg', label: 'body.lg · 15' },
  { variant: 'bodyMd', label: 'body.md · 14' },
  { variant: 'bodySm', label: 'body.sm · 13' },
  { variant: 'footnote', label: 'footnote · 12' },
  { variant: 'caption', label: 'caption · 11' },
];

const COLOR_SWATCHES: { label: string; hex: string; onDark?: boolean }[] = [
  { label: 'brand.default', hex: colors.brand.default, onDark: true },
  { label: 'brand.pressed', hex: colors.brand.pressed, onDark: true },
  { label: 'brand.dark', hex: colors.brand.dark, onDark: true },
  { label: 'brand.tint', hex: colors.brand.tint },
  { label: 'brand.tintStrong', hex: colors.brand.tintStrong },
  { label: 'brand.soft', hex: colors.brand.soft, onDark: true },
  { label: 'surface.default', hex: colors.surface.default },
  { label: 'surface.subtle', hex: colors.surface.subtle },
  { label: 'surface.warm', hex: colors.surface.warm },
  { label: 'success.default', hex: colors.success.default, onDark: true },
  { label: 'success.bg', hex: colors.success.bg },
  { label: 'danger.default', hex: colors.danger.default, onDark: true },
];

export default function Index() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMd">Theme de Cerquita</Text>
        <Text variant="bodyMd" color="secondary" style={styles.sectionIntro}>
          Pantalla de prueba — Fase 0. Se reemplaza por el Home real en la Fase 2.
        </Text>

        <Text variant="subtitle" style={styles.sectionTitle}>
          Tipografía
        </Text>
        <View style={styles.typeList}>
          {TYPE_LABELS.map(({ variant, label }) => (
            <Text key={variant} variant={variant}>
              {label} — Inter {typography[variant].fontWeight}
            </Text>
          ))}
        </View>

        <Text variant="subtitle" style={styles.sectionTitle}>
          Colores
        </Text>
        <View style={styles.swatchGrid}>
          {COLOR_SWATCHES.map(({ label, hex, onDark }) => (
            <View key={label} style={[styles.swatch, { backgroundColor: hex }]}>
              <Text variant="caption" color={onDark ? 'onBrand' : 'primary'}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        <Text variant="subtitle" style={styles.sectionTitle}>
          Button
        </Text>
        <View style={styles.buttonList}>
          <Button title="Continuar" onPress={() => {}} />
          <Button title="Deshabilitado" onPress={() => {}} disabled />
          <Button title="Cargando" onPress={() => {}} loading />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.subtle,
  },
  content: {
    padding: spacing.screenPadding,
    gap: spacing.sm,
  },
  sectionIntro: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  typeList: {
    gap: spacing.sm,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: 104,
    height: 64,
    borderRadius: radius.md,
    padding: spacing.sm,
    justifyContent: 'flex-end',
  },
  buttonList: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
});
