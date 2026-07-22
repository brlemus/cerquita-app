import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, radius, Text } from '@/shared/ui';
import { itemCount, useCartStore } from '../store/cartStore';

/**
 * Entrada global al carrito (header de Home). Selector granular de
 * itemCount -- solo este botón rerenderiza en cada cambio de cantidad,
 * no toda la pantalla que lo contiene.
 */
export function CartIconButton() {
  const router = useRouter();
  const count = useCartStore((state) => itemCount(state.lines));

  return (
    <Pressable
      onPress={() => router.push('/cart')}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `Carrito, ${count} ítems` : 'Carrito'}
    >
      <CartIcon />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text variant="caption" color="onBrand" style={styles.badgeText}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function CartIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path
        d="M2 2h1.6l.9 9.4a1.6 1.6 0 001.6 1.4h7a1.6 1.6 0 001.6-1.4L16 5H4.2"
        stroke={colors.text.primary}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="7" cy="15.5" r="1.1" fill={colors.text.primary} />
      <Circle cx="13" cy="15.5" r="1.1" fill={colors.text.primary} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: radius.full,
    backgroundColor: colors.brand.default,
    borderWidth: 1.5,
    borderColor: colors.surface.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
});
