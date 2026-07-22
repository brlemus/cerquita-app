import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, radius, spacing, Text } from '@/shared/ui';
import {
  EL_SALVADOR_DEPARTAMENTOS,
  type ElSalvadorDepartamento,
} from '../data/elSalvadorDepartamentos';

export type DepartamentoPickerProps = {
  visible: boolean;
  onSelect: (departamento: ElSalvadorDepartamento) => void;
  onClose: () => void;
};

/**
 * Modal simple (sin dependencia nueva -- `Modal` es core de React Native)
 * en vez de @react-native-picker/picker: 14 opciones no justifican una
 * dependencia nativa nueva.
 */
export function DepartamentoPicker({ visible, onSelect, onClose }: DepartamentoPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
        <View style={styles.sheet}>
          <Text variant="titleSm" style={styles.title}>
            Elegí tu departamento
          </Text>
          <ScrollView>
            {EL_SALVADOR_DEPARTAMENTOS.map((departamento) => (
              <Pressable
                key={departamento.departamento}
                style={styles.row}
                onPress={() => onSelect(departamento)}
                accessibilityRole="button"
              >
                <Text variant="bodyLg">{departamento.departamento}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface.default,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.md,
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
});
