import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing, Stepper, Text } from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils';
import type { CartLine } from '../store/cartStore';

export type CartLineRowProps = {
  line: CartLine;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function CartLineRow({ line, onIncrement, onDecrement }: CartLineRowProps) {
  return (
    <View style={styles.row}>
      {line.photoUrl ? (
        <Image
          source={{ uri: line.photoUrl }}
          style={styles.thumbnail}
          cachePolicy="memory-disk"
          contentFit="cover"
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailFallback]} />
      )}
      <View style={styles.info}>
        <Text variant="bodyLg">{line.productName}</Text>
        {line.variantOptionName ? (
          <Text variant="bodySm" color="secondary">
            {line.variantOptionName}
          </Text>
        ) : null}
        <Text variant="bodyMd" style={styles.lineTotal}>
          {formatMoneyCents(line.unitPriceCents * line.quantity)}
        </Text>
      </View>
      <Stepper value={line.quantity} onIncrement={onIncrement} onDecrement={onDecrement} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
  },
  thumbnailFallback: {
    backgroundColor: colors.surface.subtle,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  lineTotal: {
    marginTop: spacing.xs,
    fontWeight: '700',
  },
});
