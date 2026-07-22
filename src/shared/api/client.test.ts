import { configureAuth, request } from './client';
import { ApiRequestError } from './errors';

function mockFetchOnce(status: number, body: unknown, headers: Record<string, string> = {}) {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);

  globalThis.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: async () => text,
    headers: new Headers(headers),
  } as unknown as Response);
}

describe('request', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    configureAuth(async () => undefined);
  });

  it('returns the parsed body on success', async () => {
    mockFetchOnce(200, { id: '1' });

    await expect(request('/orders')).resolves.toEqual({ id: '1' });
  });

  it('returns undefined on 304 without parsing a body', async () => {
    mockFetchOnce(304, undefined);

    await expect(request('/orders/1/status')).resolves.toBeUndefined();
  });

  it('throws an ApiRequestError with the mapped kind on a non-2xx response', async () => {
    mockFetchOnce(404, { code: 'NOT_FOUND', message: 'Business not found' });

    await expect(request('/marketplace/businesses/x')).rejects.toMatchObject({
      error: { kind: 'notFound', status: 404 },
    });
  });

  it('throws a network ApiRequestError when fetch itself fails', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    const promise = request('/orders');

    await expect(promise).rejects.toBeInstanceOf(ApiRequestError);
    await expect(promise).rejects.toMatchObject({ error: { kind: 'network' } });
  });

  it('injects the Authorization header once configureAuth is set', async () => {
    configureAuth(async () => 'a-jwt');
    mockFetchOnce(200, { ok: true });

    await request('/auth/me');

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer a-jwt');
  });
});
