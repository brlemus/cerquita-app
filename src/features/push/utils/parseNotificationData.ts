export type ParsedNotificationData = {
  orderId: string;
};

/**
 * FCM entrega `data` con todos los valores como string, incluso lo que
 * el backend tipa como enum (docs/API_CONTRACT.md no lo dice, pero es
 * una restricción real del transporte). Descarta cualquier payload que
 * no sea el tipo esperado -- defensivo contra tipos de push futuros.
 */
export function parseNotificationData(
  data: Record<string, string> | undefined,
): ParsedNotificationData | null {
  if (!data) {
    return null;
  }
  if (data.type !== 'ORDER_STATUS') {
    return null;
  }
  if (typeof data.orderId !== 'string' || data.orderId.length === 0) {
    return null;
  }
  return { orderId: data.orderId };
}
