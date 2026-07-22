import { type PropsWithChildren, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from './theme';

export type KeyboardAwareScreenProps = PropsWithChildren<{
  /** Contenido fijo arriba del scroll (ej. header con back button) — nunca se tapa ni se pierde al hacer scroll. */
  header?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
}>;

/**
 * Wrapper obligatorio para toda pantalla con formulario (Login, Register,
 * checkout, direcciones, etc. — cualquier pantalla con TextInput).
 *
 * Sin esto, un input enfocado puede tapar el CTA sin forma de cerrar el
 * teclado: dead-end real (bug de gate visual, Fase 1 — ver
 * docs/phases/phase-1-auth.md). Combina `KeyboardAvoidingView` (behavior
 * correcto por plataforma) + `ScrollView` con `keyboardShouldPersistTaps=
 * "handled"`: tocar afuera de un input cierra el teclado, tocar un botón
 * funciona con el teclado abierto, y todo el contenido (CTA, links) queda
 * siempre alcanzable con scroll.
 */
export function KeyboardAwareScreen({
  children,
  header,
  contentContainerStyle,
  edges = ['top', 'bottom'],
}: KeyboardAwareScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {header}
        <ScrollView
          contentContainerStyle={[styles.content, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  content: {
    flexGrow: 1,
  },
});
