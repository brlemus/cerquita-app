import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { colors, radius, spacing, Text } from '@/shared/ui';
import type { PlatformCategory } from '../api/types';

export type CategoryChipsProps = {
  categories: PlatformCategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

/**
 * Lista chica y acotada (categorías de plataforma, no paginadas) -- no
 * justifica FlashList, que es para negocios/productos/pedidos.
 */
export function CategoryChips({ categories, selectedId, onSelect }: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Chip label="Todos" active={selectedId === null} onPress={() => onSelect(null)} />
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={category.name}
          active={selectedId === category.id}
          onPress={() => onSelect(category.id)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text variant="bodyMd" color={active ? 'onBrand' : 'primary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.default,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.brand.default,
    borderColor: colors.brand.default,
  },
});
