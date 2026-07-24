import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { OrderReviewSummary } from '@/features/reviews/api/types';
import { ApiRequestError } from '@/shared/api';
import { Button, colors, radius, spacing, Text, TextField } from '@/shared/ui';
import { useCreateReview } from '../hooks/useCreateReview';
import { reviewSchema } from '../schemas';
import { isOrderReviewed, useReviewedOrdersStore } from '../store/reviewedOrdersStore';
import { classifyReviewConflict } from '../utils/classifyReviewConflict';
import { StarRatingInput } from './StarRatingInput';

export type OrderReviewCardProps = {
  orderId: string;
  /** `Order.review` -- fuente de verdad del backend. `null`/`undefined` = no calificado (o no llegó todavía). */
  review: OrderReviewSummary | null | undefined;
};

/**
 * Vive dentro del `ScrollView` de `OrderTrackingScreen`, solo cuando
 * `ENTREGADO`. "Ya reseñado" combina la fuente de verdad del backend
 * (`review`) con `reviewedOrdersStore` como cache optimista -- cubre el
 * instante entre "el customer califica" y el próximo refetch del pedido,
 * que todavía no trae el `review` real.
 */
export function OrderReviewCard({ orderId, review }: OrderReviewCardProps) {
  const locallyReviewed = useReviewedOrdersStore((state) => isOrderReviewed(state, orderId));
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submittedRating, setSubmittedRating] = useState<number | null>(null);
  const createReview = useCreateReview(orderId);

  const reviewed = review != null || locallyReviewed;
  // Preferí el rating real del servidor; mientras no llegue (recién
  // calificado, todavía sin refetch), el que el usuario acaba de enviar.
  const displayedRating = review?.rating ?? submittedRating;

  if (reviewed) {
    return (
      <View style={styles.card}>
        <Text variant="bodyLg">¡Gracias por tu reseña!</Text>
        {displayedRating ? <StarRatingInput value={displayedRating} readOnly /> : null}
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
    setSubmittedRating(result.data.rating);
    createReview.mutate(result.data, {
      onError: (err) => {
        if (err instanceof ApiRequestError && err.error.kind === 'conflict') {
          const kind = classifyReviewConflict(err.error.details);
          if (kind === 'alreadyReviewed') {
            // el hook ya marcó reviewed -- la card cambia sola al estado de "gracias".
            return;
          }
          if (kind === 'orderNotDelivered') {
            setError('Todavía no podés calificar este pedido.');
            return;
          }
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
