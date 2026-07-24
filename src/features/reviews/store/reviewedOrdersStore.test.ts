import AsyncStorage from '@react-native-async-storage/async-storage';

import { isOrderReviewed, useReviewedOrdersStore } from './reviewedOrdersStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory se hoistea, no puede referenciar un import de módulo externo
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('reviewedOrdersStore', () => {
  beforeEach(() => {
    useReviewedOrdersStore.setState({ reviewedIds: [] });
    jest.clearAllMocks();
  });

  it('markReviewed agrega el orderId', () => {
    useReviewedOrdersStore.getState().markReviewed('order-1');
    expect(useReviewedOrdersStore.getState().reviewedIds).toEqual(['order-1']);
  });

  it('markReviewed no duplica un orderId ya marcado', () => {
    useReviewedOrdersStore.getState().markReviewed('order-1');
    useReviewedOrdersStore.getState().markReviewed('order-1');
    expect(useReviewedOrdersStore.getState().reviewedIds).toEqual(['order-1']);
  });

  it('markReviewed persiste el estado', async () => {
    useReviewedOrdersStore.getState().markReviewed('order-1');

    await new Promise((resolve) => setTimeout(resolve, 0));
    const persisted = await AsyncStorage.getItem('@cerquita/reviewed-orders');
    const parsed = persisted ? JSON.parse(persisted) : null;
    expect(parsed?.state?.reviewedIds).toEqual(['order-1']);
  });
});

describe('isOrderReviewed', () => {
  it('true si el orderId está en reviewedIds', () => {
    expect(isOrderReviewed({ reviewedIds: ['order-1'] }, 'order-1')).toBe(true);
  });

  it('false si el orderId no está en reviewedIds', () => {
    expect(isOrderReviewed({ reviewedIds: ['order-1'] }, 'order-2')).toBe(false);
  });
});
