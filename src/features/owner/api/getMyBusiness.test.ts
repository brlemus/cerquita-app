import { getMyBusiness } from './getMyBusiness';

function mockFetchOnce(status: number, body: unknown) {
  const text = body === undefined ? '' : JSON.stringify(body);
  globalThis.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: async () => text,
  } as unknown as Response);
}

describe('getMyBusiness', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the parsed MyBusiness on success', async () => {
    mockFetchOnce(200, {
      id: 'biz-1',
      ownerId: 'user-1',
      platformCategoryId: 'cat-1',
      name: 'Paletería Lili',
      logoUrl: null,
      status: 'ACTIVE',
      isOpen: true,
      deliveryFeeCents: 150,
      minOrderCents: 300,
      prepTimeMinutes: 20,
      lat: null,
      lng: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    await expect(getMyBusiness()).resolves.toMatchObject({ id: 'biz-1', name: 'Paletería Lili' });
  });

  it('throws if the response has no body (unexpected 304)', async () => {
    mockFetchOnce(304, undefined);

    await expect(getMyBusiness()).rejects.toThrow('GET /business/me returned no body');
  });
});
