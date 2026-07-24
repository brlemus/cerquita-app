import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackIcon } from '@/features/marketplace/components/icons';
import { colors, radius, spacing, Text } from '@/shared/ui';
import { PRIVACY_POLICY_SECTIONS, PRIVACY_POLICY_UPDATED_AT } from '../data/privacyPolicy';

export function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
          Privacidad
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodySm" color="secondary">
          Última actualización: {PRIVACY_POLICY_UPDATED_AT}
        </Text>
        {PRIVACY_POLICY_SECTIONS.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text variant="titleSm">{section.heading}</Text>
            <Text variant="bodyMd" color="secondary" style={styles.body}>
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
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
    gap: spacing.xl,
  },
  section: {
    gap: spacing.xs,
  },
  body: {
    lineHeight: 20,
  },
});
