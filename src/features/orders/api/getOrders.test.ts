import { getOrders } from './getOrders';

function mockFetchOnce(status: number, body: unknown) {
  const text = body === undefined ? '' : JSON.stringify(body);
  globalThis.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: async () => text,
  } as unknown as Response);
}

const paginatedOrders = {
  data: [{ id: 'order-1', status: 'PENDIENTE' }],
  nextCursor: null,
  hasNextPage: false,
};

describe('getOrders', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('pega a /orders sin query cuando no hay params', async () => {
    mockFetchOnce(200, paginatedOrders);

    await getOrders();

    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl.endsWith('/orders')).toBe(true);
  });

  it('arma el query string con cursor y limit', async () => {
    mockFetchOnce(200, paginatedOrders);

    await getOrders({ cursor: 'abc', limit: 10 });

    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('cursor=abc');
    expect(calledUrl).toContain('limit=10');
  });

  it('devuelve la respuesta paginada', async () => {
    mockFetchOnce(200, paginatedOrders);

    await expect(getOrders()).resolves.toMatchObject(paginatedOrders);
  });

  it('throws si la respuesta no tiene body', async () => {
    mockFetchOnce(304, undefined);

    await expect(getOrders()).rejects.toThrow('GET /orders returned no body');
  });
});
