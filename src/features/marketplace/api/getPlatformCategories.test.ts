import { getPlatformCategories } from './getPlatformCategories';

function mockFetchOnce(status: number, body: unknown) {
  const text = body === undefined ? '' : JSON.stringify(body);
  globalThis.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: async () => text,
  } as unknown as Response);
}

describe('getPlatformCategories', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('pega a /platform/categories', async () => {
    mockFetchOnce(200, []);

    await getPlatformCategories();

    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl.endsWith('/platform/categories')).toBe(true);
  });

  it('devuelve el array de categorías', async () => {
    mockFetchOnce(200, [{ id: 'c1', name: 'Postres', icon: null, sortOrder: 0 }]);

    await expect(getPlatformCategories()).resolves.toMatchObject([{ id: 'c1' }]);
  });

  it('throws si la respuesta no tiene body', async () => {
    mockFetchOnce(304, undefined);

    await expect(getPlatformCategories()).rejects.toThrow(
      'GET /platform/categories returned no body',
    );
  });
});
