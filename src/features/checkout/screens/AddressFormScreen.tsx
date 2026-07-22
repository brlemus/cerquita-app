import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { BackIcon } from '@/features/marketplace/components/icons';
import { ApiRequestError } from '@/shared/api';
import {
  Button,
  colors,
  ErrorState,
  KeyboardAwareScreen,
  radius,
  Skeleton,
  spacing,
  Text,
  TextField,
} from '@/shared/ui';
import { DepartamentoPicker } from '../components/DepartamentoPicker';
import { LocationCaptureCard } from '../components/LocationCaptureCard';
import type { ElSalvadorDepartamento } from '../data/elSalvadorDepartamentos';
import { useAddresses } from '../hooks/useAddresses';
import { useAddressLocation } from '../hooks/useAddressLocation';
import { useCreateAddress } from '../hooks/useCreateAddress';
import { useDeleteAddress } from '../hooks/useDeleteAddress';
import { useSetDefaultAddress } from '../hooks/useSetDefaultAddress';
import { useUpdateAddress } from '../hooks/useUpdateAddress';
import { addressFormSchema, type AddressFormValues } from '../schemas';

/**
 * Create y edit son la misma pantalla: `addressId` en la ruta decide.
 * `returnTo` (opcional) navega ahí con `?addressId=<id>` al guardar --
 * lo usa Checkout cuando no hay dirección todavía o al agregar una nueva
 * a mitad del flujo.
 */
export function AddressFormScreen() {
  const router = useRouter();
  const { addressId, returnTo } = useLocalSearchParams<{
    addressId?: string;
    returnTo?: string;
  }>();
  const isEdit = !!addressId;

  const addressesQuery = useAddresses();
  const existingAddress = isEdit
    ? addressesQuery.data?.data.find((a) => a.id === addressId)
    : undefined;

  const location = useAddressLocation(
    existingAddress ? { lat: existingAddress.lat, lng: existingAddress.lng } : undefined,
  );
  const [departamentoPickerVisible, setDepartamentoPickerVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: { label: '', line: '', instructions: '' },
  });

  useEffect(() => {
    if (existingAddress) {
      reset({
        label: existingAddress.label ?? '',
        line: existingAddress.line,
        instructions: existingAddress.instructions ?? '',
      });
    }
  }, [existingAddress, reset]);

  useEffect(() => {
    if (location.source === 'gps' && location.reverseGeocodedLine) {
      setValue('line', location.reverseGeocodedLine);
    }
  }, [location.source, location.reverseGeocodedLine, setValue]);

  async function performSave(values: AddressFormValues, lat: number, lng: number) {
    setFormError(null);
    const payload = {
      label: values.label || undefined,
      line: values.line,
      instructions: values.instructions || undefined,
      lat,
      lng,
    };
    try {
      const saved =
        isEdit && existingAddress
          ? await updateAddress.mutateAsync({ addressId: existingAddress.id, payload })
          : await createAddress.mutateAsync(payload);
      if (returnTo) {
        // `returnTo` es un string arbitrario en runtime (viene de query
        // params) -- expo-router no puede tipar rutas dinámicas así, `as
        // never` es el escape hatch (nunca `any`).
        router.replace(`${returnTo}?addressId=${saved.id}` as never);
      } else {
        router.back();
      }
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? Array.isArray(error.error.message)
            ? error.error.message.join(', ')
            : error.error.message
          : 'No pudimos guardar la dirección. Intentá de nuevo.';
      setFormError(message);
    }
  }

  async function onValidSubmit(values: AddressFormValues) {
    if (location.lat !== null && location.lng !== null) {
      await performSave(values, location.lat, location.lng);
      return;
    }
    const geocoded = await location.tryGeocodeLine(values.line);
    if (geocoded) {
      await performSave(values, geocoded.lat, geocoded.lng);
    } else {
      setDepartamentoPickerVisible(true);
    }
  }

  function handleDepartamentoSelect(departamento: ElSalvadorDepartamento) {
    location.selectDepartamento(departamento);
    setDepartamentoPickerVisible(false);
    handleSubmit((values) => performSave(values, departamento.lat, departamento.lng))();
  }

  function handleDelete() {
    if (!existingAddress) return;
    Alert.alert('Eliminar dirección', '¿Seguro que querés eliminar esta dirección?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteAddress.mutateAsync(existingAddress.id);
          router.back();
        },
      },
    ]);
  }

  function handleSetDefault() {
    if (existingAddress) {
      setDefaultAddress.mutate(existingAddress.id);
    }
  }

  if (isEdit && addressesQuery.isPending) {
    return (
      <View style={styles.loading}>
        <Skeleton width="100%" height={44} />
        <Skeleton width="100%" height={80} />
      </View>
    );
  }

  if (isEdit && !existingAddress) {
    return (
      <View style={styles.loading}>
        <ErrorState message="No encontramos esta dirección." onRetry={() => router.back()} />
      </View>
    );
  }

  const submitLabel =
    location.status === 'manual' && location.lat === null
      ? 'Buscar ubicación'
      : isEdit
        ? 'Guardar cambios'
        : 'Guardar dirección';

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
          <Text variant="titleSm">{isEdit ? 'Editar dirección' : 'Nueva dirección'}</Text>
        </View>
      }
    >
      <LocationCaptureCard location={location} />

      <Controller
        control={control}
        name="line"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="¿Cómo llegamos?"
            placeholder="Ej. Frente a la tienda El Progreso, portón verde"
            multiline
            numberOfLines={3}
            style={styles.multiline}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.line?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="instructions"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Instrucciones para el repartidor (opcional)"
            placeholder="Ej. Toca el timbre, casa azul"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.instructions?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="label"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Ponele un nombre (opcional)"
            placeholder="Casa, Trabajo…"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.label?.message}
          />
        )}
      />

      {formError ? (
        <Text variant="bodySm" color="danger">
          {formError}
        </Text>
      ) : null}

      <Button
        title={submitLabel}
        size="lg"
        loading={isSubmitting}
        onPress={handleSubmit(onValidSubmit)}
        style={styles.submit}
      />

      {isEdit && existingAddress ? (
        <View style={styles.secondaryActions}>
          {!existingAddress.isDefault ? (
            <Pressable onPress={handleSetDefault} accessibilityRole="button">
              <Text variant="bodySm" color="brand">
                Marcar como predeterminada
              </Text>
            </Pressable>
          ) : null}
          <Pressable onPress={handleDelete} accessibilityRole="button">
            <Text variant="bodySm" color="danger">
              Eliminar dirección
            </Text>
          </Pressable>
        </View>
      ) : null}

      <DepartamentoPicker
        visible={departamentoPickerVisible}
        onSelect={handleDepartamentoSelect}
        onClose={() => setDepartamentoPickerVisible(false)}
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
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submit: {
    marginTop: spacing.sm,
  },
  secondaryActions: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  loading: {
    flex: 1,
    padding: spacing.xxl,
    gap: spacing.md,
    justifyContent: 'center',
  },
});
