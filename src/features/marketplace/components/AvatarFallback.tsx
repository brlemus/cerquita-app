import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors, radius, Text } from '@/shared/ui';

export type AvatarFallbackProps = {
  uri?: string | null;
  label: string;
  size: number;
};

function initialsOf(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/**
 * Logo real vía expo-image cuando `uri` existe; si no, monograma de
 * iniciales -- no hay campo de color por negocio en el contrato, tono de
 * marca uniforme para todos.
 */
export function AvatarFallback({ uri, label, size }: AvatarFallbackProps) {
  const boxStyle = { width: size, height: size, borderRadius: radius.xl };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, boxStyle]}
        cachePolicy="memory-disk"
        contentFit="cover"
        accessibilityLabel={label}
      />
    );
  }

  return (
    <View style={[styles.fallback, boxStyle]}>
      <Text
        variant="titleSm"
        color="brand"
        style={{ fontSize: size * 0.32 }}
        accessibilityLabel={label}
      >
        {initialsOf(label)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surface.subtle,
  },
  fallback: {
    backgroundColor: colors.brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
