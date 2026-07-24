import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { BackIcon } from '@/features/marketplace/components/icons';
import { ApiRequestError } from '@/shared/api';
import { Button, colors, KeyboardAwareScreen, radius, spacing, Text, TextField } from '@/shared/ui';
import type { FeedbackCategory } from '../api/types';
import { useSubmitFeedback } from '../hooks/useSubmitFeedback';
import { feedbackSchema } from '../schemas';

const CATEGORY_OPTIONS: { value: FeedbackCategory; label: string }[] = [
  { value: 'SUGERENCIA', label: 'Sugerencia' },
  { value: 'BUG', label: 'Bug' },
  { value: 'QUEJA', label: 'Queja' },
  { value: 'OTRO', label: 'Otro' },
];

// Solo `text` vive en react-hook-form -- `category` es un chip de selección
// simple, no un input controlado; RHF de más para un solo booleano-ish sería
// sobre-ingeniería, y `watch()` no memoiza bien con el React Compiler.
const textSchema = feedbackSchema.pick({ text: true });
type TextFormValues = { text: string };

export function FeedbackScreen() {
  const router = useRouter();
  const submitFeedback = useSubmitFeedback();
  const [category, setCategory] = useState<FeedbackCategory | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TextFormValues>({
    resolver: zodResolver(textSchema),
    defaultValues: { text: '' },
  });

  async function onValidSubmit(values: TextFormValues) {
    setFormError(null);
    try {
      await submitFeedback.mutateAsync({ text: values.text, category });
      Alert.alert('¡Gracias por tu comentario!', undefined, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? Array.isArray(error.error.message)
            ? error.error.message.join(', ')
            : error.error.message
          : 'No pudimos enviar tu comentario. Intentá de nuevo.';
      setFormError(message);
    }
  }

  return (
    <KeyboardAwareScreen
      contentContainerStyle={styles.form}
      header={
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <BackIcon />
          </Pressable>
          <Text variant="titleSm">Enviar comentarios</Text>
        </View>
      }
    >
      <Text variant="bodySm" color="secondary">
        Categoría (opcional)
      </Text>
      <View style={styles.chipsRow}>
        {CATEGORY_OPTIONS.map((option) => {
          const active = category === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setCategory(active ? undefined : option.value)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text variant="bodyMd" color={active ? 'onBrand' : 'primary'}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Controller
        control={control}
        name="text"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Contanos qué pasó"
            placeholder="Escribí tu comentario, sugerencia o reporte de error"
            multiline
            numberOfLines={5}
            style={styles.multiline}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.text?.message}
          />
        )}
      />

      {formError ? (
        <Text variant="bodySm" color="danger">
          {formError}
        </Text>
      ) : null}

      <Button
        title="Enviar"
        size="lg"
        loading={isSubmitting}
        onPress={handleSubmit(onValidSubmit)}
        style={styles.submit}
      />
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submit: {
    marginTop: spacing.sm,
  },
});
