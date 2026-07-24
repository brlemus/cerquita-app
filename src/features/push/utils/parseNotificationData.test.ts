import { parseNotificationData } from './parseNotificationData';

describe('parseNotificationData', () => {
  it('parsea un payload válido de ORDER_STATUS', () => {
    expect(
      parseNotificationData({ orderId: 'order-1', status: 'PREPARANDO', type: 'ORDER_STATUS' }),
    ).toEqual({ orderId: 'order-1' });
  });

  it('devuelve null si data es undefined', () => {
    expect(parseNotificationData(undefined)).toBeNull();
  });

  it('devuelve null si el type no es ORDER_STATUS (defensivo ante push futuros)', () => {
    expect(parseNotificationData({ orderId: 'order-1', type: 'PROMO' })).toBeNull();
  });

  it('devuelve null si falta el type', () => {
    expect(parseNotificationData({ orderId: 'order-1' })).toBeNull();
  });

  it('devuelve null si falta orderId', () => {
    expect(parseNotificationData({ type: 'ORDER_STATUS' })).toBeNull();
  });

  it('devuelve null si orderId es un string vacío', () => {
    expect(parseNotificationData({ orderId: '', type: 'ORDER_STATUS' })).toBeNull();
  });
});
