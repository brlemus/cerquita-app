import { getBusinessById } from './getBusinessById';

function mockFetchOnce(status: number, body: unknown) {
  const text = body === undefined ? '' : JSON.stringify(body);
  globalThis.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: async () => text,
  } as unknown as Response);
}

describe('getBusinessById', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('pega a /marketplace/businesses/:id', async () => {
    mockFetchOnce(200, { id: 'b1', name: 'Paletería Lili' });

    await getBusinessById('b1');

    const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl.endsWith('/marketplace/businesses/b1')).toBe(true);
  });

  it('devuelve el negocio parseado', async () => {
    mockFetchOnce(200, { id: 'b1', name: 'Paletería Lili' });

    await expect(getBusinessById('b1')).resolves.toMatchObject({ id: 'b1' });
  });

  it('rechaza con notFound si el negocio no existe o no está ACTIVE', async () => {
    mockFetchOnce(404, { code: 'NOT_FOUND', message: 'Business not found' });

    await expect(getBusinessById('b1')).rejects.toMatchObject({ error: { kind: 'notFound' } });
  });

  it('throws si la respuesta no tiene body', async () => {
    mockFetchOnce(304, undefined);

    await expect(getBusinessById('b1')).rejects.toThrow(
      'GET /marketplace/businesses/:id returned no body',
    );
  });
});
