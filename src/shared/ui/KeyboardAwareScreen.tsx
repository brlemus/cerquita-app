import { type PropsWithChildren, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
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
  /**
   * Pass-through a `KeyboardAvoidingView`. Sin default hardcodeado a
   * propósito -- si una pantalla puntual lo necesita (por la altura de su
   * propio `header`), se ajusta ahí, no en este wrapper compartido.
   * Ninguna pantalla actual lo necesita (sin header nativo de navegación
   * en ningún lado, `headerShown: false` en todos los Stack).
   */
  keyboardVerticalOffset?: number;
}>;

/**
 * Wrapper obligatorio para toda pantalla con formulario (Login, Register,
 * checkout, direcciones, etc. — cualquier pantalla con TextInput).
 *
 * Sin esto, un input enfocado puede tapar el CTA sin forma de cerrar el
 * teclado: dead-end real (bug de gate visual, Fase 1 — ver
 * docs/phases/phase-1-auth.md). Combina `KeyboardAvoidingView` + `ScrollView`
 * con `keyboardShouldPersistTaps="handled"`: tocar afuera de un input
 * cierra el teclado, tocar un botón funciona con el teclado abierto, y
 * todo el contenido (CTA, links) queda siempre alcanzable con scroll.
 *
 * `behavior="padding"` en AMBAS plataformas (antes solo iOS, `undefined`
 * en Android) -- bug real de gate visual (docs/phases/
 * chore-brand-v2-login-splash.md): con edge-to-edge activo (default desde
 * SDK 55+), `windowSoftInputMode="adjustResize"` deja de redimensionar la
 * ventana de forma confiable en Android, incompatibilidad documentada del
 * ecosistema RN, no un bug de esta app. Con `behavior={undefined}`,
 * Android no tenía NINGÚN mecanismo de reacción al teclado -- dependía
 * 100% de un resize que ya no llega. `padding` engancha el propio
 * listener de `Keyboard` de RN, que sí funciona en ambas plataformas.
 */
export function KeyboardAwareScreen({
  children,
  header,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  keyboardVerticalOffset,
}: KeyboardAwareScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}
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
