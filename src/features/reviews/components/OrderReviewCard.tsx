import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiRequestError } from '@/shared/api';
import { Button, colors, radius, spacing, Text, TextField } from '@/shared/ui';
import { useCreateReview } from '../hooks/useCreateReview';
import { reviewSchema } from '../schemas';
import { isOrderReviewed, useReviewedOrdersStore } from '../store/reviewedOrdersStore';
import { StarRatingInput } from './StarRatingInput';

export type OrderReviewCardProps = {
  orderId: string;
};

/**
 * Vive dentro del `ScrollView` de `OrderTrackingScreen`, solo cuando
 * `ENTREGADO`. "Ya reseñado" lee `reviewedOrdersStore` -- no hay endpoint de
 * listado para el customer (docs/API_CONTRACT.md, sección 6).
 */
export function OrderReviewCard({ orderId }: OrderReviewCardProps) {
  const reviewed = useReviewedOrdersStore((state) => isOrderReviewed(state, orderId));
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createReview = useCreateReview(orderId);

  if (reviewed) {
    return (
      <View style={styles.card}>
        <Text variant="bodyLg">¡Gracias por tu reseña!</Text>
        <Text variant="bodySm" color="secondary">
          Tu opinión ayuda a otros clientes a elegir este negocio.
        </Text>
      </View>
    );
  }

  function handleSubmit() {
    setError(null);
    const result = reviewSchema.safeParse({ rating, comment: comment.trim() || undefined });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revisá tu reseña.');
      return;
    }
    createReview.mutate(result.data, {
      onError: (err) => {
        // 409 (ya reseñado) marca `reviewed` en el hook -- la card cambia
        // sola al estado de "gracias", sin mensaje de error acá.
        if (err instanceof ApiRequestError && err.error.kind === 'conflict') {
          return;
        }
        setError('No pudimos enviar tu reseña. Intentá de nuevo.');
      },
    });
  }

  return (
    <View style={styles.card}>
      <Text variant="bodyLg">¿Cómo te fue con tu pedido?</Text>
      <StarRatingInput value={rating} onChange={setRating} />
      <TextField
        label="Contanos cómo te fue (opcional)"
        placeholder="Tu comentario ayuda a otros clientes"
        multiline
        numberOfLines={3}
        style={styles.multiline}
        value={comment}
        onChangeText={setComment}
      />
      {error ? (
        <Text variant="bodySm" color="danger">
          {error}
        </Text>
      ) : null}
      <Button title="Enviar reseña" loading={createReview.isPending} onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.xxl,
    backgroundColor: colors.surface.subtle,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
});
