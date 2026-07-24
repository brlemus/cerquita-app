import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { getClerkErrorMessage } from '../clerkErrorMessage';
import { useLogout } from '../hooks/useLogout';
import { completeNameSchema, type CompleteNameFormValues } from '../schemas';
import { Button, KeyboardAwareScreen, spacing, Text, TextField } from '@/shared/ui';

export type CompleteNameScreenProps = {
  onSubmit: (name: string) => Promise<void>;
};

/**
 * Pantalla para el caso del claim `name` vacío (ej. Apple sin compartir
 * nombre) — diseñada fresh desde TOKENS.md, mismo criterio que
 * VerifyEmailScreen. La renderiza AccountGate, proactivamente cuando
 * Clerk no tiene `firstName`, y defensivamente si /auth/me igual devuelve
 * 400 (kind 'validation').
 */
export function CompleteNameScreen({ onSubmit }: CompleteNameScreenProps) {
  const logout = useLogout();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompleteNameFormValues>({
    resolver: zodResolver(completeNameSchema),
    defaultValues: { name: '' },
  });

  async function handleSave(values: CompleteNameFormValues) {
    setFormError(null);
    try {
      await onSubmit(values.name);
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    }
  }

  return (
    <KeyboardAwareScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="titleMd">Completá tu nombre</Text>
        <Text variant="bodyMd" color="secondary" style={styles.subtitle}>
          Necesitamos tu nombre para crear tu cuenta.
        </Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Nombre"
              placeholder="Tu nombre"
              autoComplete="name"
              textContentType="name"
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
            />
          )}
        />
        {formError ? (
          <Text variant="bodySm" color="danger">
            {formError}
          </Text>
        ) : null}
        <Button
          title="Continuar"
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit(handleSave)}
          style={styles.submit}
        />
        <Pressable accessibilityRole="button" onPress={() => logout()} style={styles.signOut}>
          <Text variant="bodySm" color="secondary">
            Cerrar sesión
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
  },
  header: {
    paddingTop: spacing.xxxl * 2,
    gap: spacing.sm,
  },
  subtitle: {
    lineHeight: 20,
  },
  form: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  submit: {
    marginTop: spacing.xs,
  },
  signOut: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
});
