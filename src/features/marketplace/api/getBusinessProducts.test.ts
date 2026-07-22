import { getBusinessProducts } from './getBusinessProducts';

function mockFetchOnce(status: number, body: unknown) {
  const text = body === undefined ? '' : JSON.stringify(body);
  globalThis.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: async () => text,
  } as unknown as Response);
}

const paginatedProducts = {
  data: [{ id: 'p1', name: 'Paleta de sobrilla' }],
  nextCursor: null,
  hasNextPage: false,
};

describe('getBusinessProducts', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('pega a /marketplace/businesses/:id/products', async () => {
    mockFetchOnce(200, paginatedProducts);

    await getBusinessProducts('b1');

    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl.endsWith('/marketplace/businesses/b1/products')).toBe(true);
  });

  it('arma el query string con cursor', async () => {
    mockFetchOnce(200, paginatedProducts);

    await getBusinessProducts('b1', { cursor: 'abc' });

    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('cursor=abc');
  });

  it('devuelve la respuesta paginada', async () => {
    mockFetchOnce(200, paginatedProducts);

    await expect(getBusinessProducts('b1')).resolves.toMatchObject(paginatedProducts);
  });

  it('throws si la respuesta no tiene body', async () => {
    mockFetchOnce(304, undefined);

    await expect(getBusinessProducts('b1')).rejects.toThrow(
      'GET /marketplace/businesses/:id/products returned no body',
    );
  });
});
