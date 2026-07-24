import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing, Text } from '@/shared/ui';
import type { OrderStatus } from '../api/types';
import { getStepState, ORDER_STEPS } from '../utils/orderStatus';

export type OrderStatusStepperProps = {
  status: OrderStatus;
};

const DOT_SIZE = 24;

export function OrderStatusStepper({ status }: OrderStatusStepperProps) {
  return (
    <View style={styles.container}>
      {ORDER_STEPS.map((step, index) => {
        const state = getStepState(status, step.status);
        const isLast = index === ORDER_STEPS.length - 1;

        return (
          <View key={step.status} style={styles.row}>
            <View style={styles.dotColumn}>
              <View
                style={[
                  styles.dot,
                  state === 'done' && styles.dotDone,
                  state === 'current' && styles.dotCurrent,
                ]}
              >
                {state === 'done' ? (
                  <Text variant="caption" color="onBrand">
                    ✓
                  </Text>
                ) : null}
              </View>
              {!isLast ? <View style={[styles.line, state === 'done' && styles.lineDone]} /> : null}
            </View>
            <View style={styles.textColumn}>
              <Text variant="bodyLg" color={state === 'upcoming' ? 'secondary' : 'primary'}>
                {step.label}
              </Text>
              <Text variant="bodySm" color="secondary">
                {step.description}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dotColumn: {
    alignItems: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.surface.mutedAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.success.default,
  },
  dotCurrent: {
    backgroundColor: colors.brand.default,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: colors.border.default,
  },
  lineDone: {
    backgroundColor: colors.success.default,
  },
  textColumn: {
    flex: 1,
    paddingBottom: spacing.lg,
    gap: 2,
  },
});
