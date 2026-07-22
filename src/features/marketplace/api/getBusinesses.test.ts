import { getBusinesses } from './getBusinesses';

function mockFetchOnce(status: number, body: unknown) {
  const text = body === undefined ? '' : JSON.stringify(body);
  globalThis.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: async () => text,
  } as unknown as Response);
}

const paginatedBusiness = {
  data: [{ id: 'b1', name: 'Paletería Lili' }],
  nextCursor: null,
  hasNextPage: false,
};

describe('getBusinesses', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('pega a /marketplace/businesses sin query cuando no hay params', async () => {
    mockFetchOnce(200, paginatedBusiness);

    await getBusinesses();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/marketplace/businesses'),
      expect.anything(),
    );
    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl.endsWith('/marketplace/businesses')).toBe(true);
  });

  it('arma el query string con cursor, search y platformCategoryId', async () => {
    mockFetchOnce(200, paginatedBusiness);

    await getBusinesses({ cursor: 'abc', search: 'lili', platformCategoryId: 'cat-1' });

    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('cursor=abc');
    expect(calledUrl).toContain('search=lili');
    expect(calledUrl).toContain('platformCategoryId=cat-1');
  });

  it('devuelve la respuesta paginada', async () => {
    mockFetchOnce(200, paginatedBusiness);

    await expect(getBusinesses()).resolves.toMatchObject(paginatedBusiness);
  });

  it('throws si la respuesta no tiene body', async () => {
    mockFetchOnce(304, undefined);

    await expect(getBusinesses()).rejects.toThrow('GET /marketplace/businesses returned no body');
  });
});
